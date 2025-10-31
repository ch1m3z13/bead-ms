import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import {
  createSupabaseClient,
  createQueue,
  redisConnection,
  QUEUE_NAMES,
  ScrapeProjectJob,
  GeneratePostsJob,
  Insight,
} from '@bead/shared';

dotenv.config();

const supabase = createSupabaseClient();
const postgenQueue = createQueue<GeneratePostsJob>(QUEUE_NAMES.GENERATE_POSTS);

// Mock data generators
function generateMockTwitterInsights(projectName: string, count: number = 3): Partial<Insight>[] {
  const templates = [
    { content: `Just saw ${projectName} hit a major milestone! The community is buzzing 🔥`, author: '@cryptowhale' },
    { content: `${projectName} is solving a real problem in the space. Finally someone gets it.`, author: '@builder_dev' },
    { content: `Been using ${projectName} for a week. This could be huge if they execute well.`, author: '@early_adopter' },
    { content: `The ${projectName} team just shipped another update. Love the pace of innovation here.`, author: '@techoptimist' },
    { content: `${projectName}'s approach to this is genuinely novel. Watching closely 👀`, author: '@analyst_eth' },
  ];

  return templates.slice(0, count).map((template, i) => ({
    source: 'twitter' as const,
    content: template.content,
    author: template.author,
    url: `https://twitter.com/${template.author.slice(1)}/status/${Date.now() + i}`,
    metadata: {
      likes: Math.floor(Math.random() * 500) + 50,
      retweets: Math.floor(Math.random() * 100) + 10,
    },
  }));
}

function generateMockFarcasterInsights(projectName: string, count: number = 2): Partial<Insight>[] {
  const templates = [
    { content: `${projectName} just launched on mainnet. Been testing since testnet - solid work from the team.`, author: 'vitalik.eth' },
    { content: `Interesting tech stack on ${projectName}. The architecture is clean and scalable.`, author: 'dwr.eth' },
    { content: `${projectName} solving real user problems. This is what we need more of in crypto.`, author: 'jessepollak' },
  ];

  return templates.slice(0, count).map((template, i) => ({
    source: 'farcaster' as const,
    content: template.content,
    author: template.author,
    url: `https://warpcast.com/${template.author}/0x${(Date.now() + i).toString(16)}`,
    metadata: {
      reactions: Math.floor(Math.random() * 100) + 20,
      recasts: Math.floor(Math.random() * 30) + 5,
    },
  }));
}

// Worker
const scrapeWorker = new Worker<ScrapeProjectJob>(
  QUEUE_NAMES.SCRAPE_PROJECT,
  async (job) => {
    const { projectId, sources } = job.data;

    console.log(`🔍 Starting scrape job for project ${projectId}...`);

    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      console.log(`   Project: ${project.name}`);

      // Generate mock insights
      const mockInsights: Partial<Insight>[] = [];

      if (sources.includes('twitter')) {
        console.log('   📱 Fetching Twitter insights (mock)...');
        mockInsights.push(...generateMockTwitterInsights(project.name, 3));
      }

      if (sources.includes('farcaster')) {
        console.log('   🎩 Fetching Farcaster insights (mock)...');
        mockInsights.push(...generateMockFarcasterInsights(project.name, 2));
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Insert insights
      const insightsToInsert = mockInsights.map((insight) => ({
        ...insight,
        project_id: projectId,
      }));

      const { data: insertedInsights, error: insertError } = await supabase
        .from('insights')
        .insert(insightsToInsert)
        .select();

      if (insertError) throw insertError;

      console.log(`   ✅ Stored ${insertedInsights.length} insights`);

      // Enqueue post generation
      await postgenQueue.add('generate', {
        projectId,
        insightIds: insertedInsights.map((i) => i.id),
      });

      console.log(`   📤 Enqueued post generation job`);

      return {
        success: true,
        insightsCount: insertedInsights.length,
      };
    } catch (error: any) {
      console.error(`   ❌ Scrape failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 jobs simultaneously
  }
);

// Event handlers
scrapeWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully\n`);
});

scrapeWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message, '\n');
});

scrapeWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log(`
🔍 Scraper Service Started
📊 Listening to queue: ${QUEUE_NAMES.SCRAPE_PROJECT}
🔄 Concurrency: 2
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down scraper worker...');
  await scrapeWorker.close();
  await redisConnection.quit();
  process.exit(0);
});