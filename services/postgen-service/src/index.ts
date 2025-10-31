import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import {
  createSupabaseClient,
  redisConnection,
  QUEUE_NAMES,
  GeneratePostsJob,
  Post,
} from '@bead/shared';

dotenv.config();

const supabase = createSupabaseClient();

// Simple post generation (we'll replace with real LLM later)
function generateWittyPost(projectName: string, insights: any[]): Partial<Post> {
  const styles = [
    {
      tone: 'witty' as const,
      templates: [
        `${projectName} is cooking and the community knows it 👨‍🍳\n\nThe vibes are immaculate:\n• ${insights.length} new mentions this week\n• Early adopters are already seeing the vision\n• This is just the beginning`,
        `Not financial advice but ${projectName} is making moves 📈\n\nWhat people are saying:\n• "This could be huge"\n• "Finally someone gets it"\n• "Been waiting for something like this"\n\nStill early 👀`,
        `${projectName} speedrun any% WR incoming 🏃‍♂️\n\nThe momentum is real:\n✅ Community growing\n✅ Product shipping\n✅ Vibes immaculate\n\nLFG`,
      ],
    },
    {
      tone: 'hype' as const,
      templates: [
        `🚀 ${projectName} SEASON IS HERE 🚀\n\n${insights.length} power users are already talking about it\n\nThis is your reminder to pay attention 👀\n\nGM`,
        `The ${projectName} rocket is fueling up ⛽\n\n✨ Community: Growing\n✨ Tech: Shipping\n✨ Vibes: Immaculate\n\nWe're so early it's not even funny`,
      ],
    },
    {
      tone: 'educational' as const,
      templates: [
        `Why ${projectName} matters 🧵\n\n1/ The team is solving a real problem\n2/ Community feedback has been overwhelmingly positive\n3/ The tech stack is solid and scalable\n\nEarly signals are promising. Worth watching.`,
        `${projectName} deep dive:\n\nWhat's working:\n• Strong community engagement\n• Consistent shipping cadence\n• Clear product-market fit signals\n\nThe data is interesting. Thread 👇`,
      ],
    },
  ];

  const style = styles[Math.floor(Math.random() * styles.length)];
  const template = style.templates[Math.floor(Math.random() * style.templates.length)];

  return {
    content: template,
    tone: style.tone,
  };
}

// Worker
const postgenWorker = new Worker<GeneratePostsJob>(
  QUEUE_NAMES.GENERATE_POSTS,
  async (job) => {
    const { projectId, insightIds } = job.data;

    console.log(`✨ Starting post generation for project ${projectId}...`);

    try {
      // Fetch project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch insights
      const { data: insights, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .in('id', insightIds);

      if (insightsError) throw insightsError;

      console.log(`   Project: ${project.name}`);
      console.log(`   Insights: ${insights.length}`);

      // Simulate LLM processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate posts (for now, just 1-2 posts per batch of insights)
      const numPosts = Math.random() > 0.5 ? 2 : 1;
      const postsToInsert = [];

      for (let i = 0; i < numPosts; i++) {
        const post = generateWittyPost(project.name, insights);
        postsToInsert.push({
          ...post,
          project_id: projectId,
          insight_ids: insightIds,
        });
      }

      // Insert posts
      const { data: insertedPosts, error: insertError } = await supabase
        .from('posts')
        .insert(postsToInsert)
        .select();

      if (insertError) throw insertError;

      console.log(`   ✅ Generated ${insertedPosts.length} posts`);
      insertedPosts.forEach((post, i) => {
        console.log(`   📝 Post ${i + 1} [${post.tone}]: ${post.content.substring(0, 50)}...`);
      });

      return {
        success: true,
        postsCount: insertedPosts.length,
      };
    } catch (error: any) {
      console.error(`   ❌ Post generation failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one at a time to avoid rate limits
  }
);

// Event handlers
postgenWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully\n`);
});

postgenWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message, '\n');
});

postgenWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log(`
✨ Post Generation Service Started
📊 Listening to queue: ${QUEUE_NAMES.GENERATE_POSTS}
🔄 Concurrency: 1
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down postgen worker...');
  await postgenWorker.close();
  await redisConnection.quit();
  process.exit(0);
});