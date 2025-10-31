import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSupabaseClient, createQueue, checkRedisConnection, QUEUE_NAMES, ScrapeProjectJob } from '@bead/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize clients
const supabase = createSupabaseClient();
const scrapeQueue = createQueue<ScrapeProjectJob>(QUEUE_NAMES.SCRAPE_PROJECT);

// Health check
app.get('/health', async (req, res) => {
  const redisOk = await checkRedisConnection();
  res.json({
    status: 'ok',
    service: 'core-api',
    redis: redisOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new project and enqueue scraping
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, twitter_handle, farcaster_channel } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        twitter_handle,
        farcaster_channel,
        user_id: 'demo-user', // Replace with real auth later
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Project created: ${project.id}`);

    // Enqueue scraping job
    const sources: Array<'twitter' | 'farcaster'> = [];
    if (twitter_handle) sources.push('twitter');
    if (farcaster_channel) sources.push('farcaster');

    if (sources.length > 0) {
      await scrapeQueue.add('scrape', {
        projectId: project.id,
        sources,
      });
      console.log(`📤 Enqueued scraping job for project ${project.id}`);
    }

    res.status(201).json({
      ...project,
      message: sources.length > 0 ? 'Project created and scraping enqueued' : 'Project created',
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project with insights and posts
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) throw projectError;

    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    res.json({
      ...project,
      insights: insights || [],
      posts: posts || [],
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  const redisOk = await checkRedisConnection();
  console.log(`
🚀 Core API running on http://localhost:${PORT}
📊 Redis: ${redisOk ? '✅ Connected' : '❌ Disconnected'}
🔍 Health check: http://localhost:${PORT}/health
  `);
});