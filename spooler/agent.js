import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://wirvxlbsenkkeehhdnir.supabase.co';
// .env.local wali apni real anon key yahan verify karein
const SUPABASE_KEY = 'sb_publishable_k_DzshW3C_hRUKOQfPSxCQ_fTxJoAYa';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tempDir = path.join(process.cwd(), 'temp_prints');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

console.log('====================================');
console.log('🖨️  ScanToPrint Robust Poller Agent Started');
console.log('📡 Actively monitoring queue for new print jobs...');
console.log('====================================\n');

let isProcessing = false;

async function checkQueue() {
  if (isProcessing) return;

  try {
    // 1. In_queue wale jobs ko pick karein
    const { data: jobs, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('status', 'in_queue')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Queue check error:', error.message);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0];
      isProcessing = true;
      await processJob(job);
      isProcessing = false;
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
    isProcessing = false;
  }
}

async function processJob(job) {
  try {
    console.log(`\n📥 New Job Detected: [${job.id}]`);
    console.log(`📄 File: ${job.file_name} | Amount: ₹${job.total_amount}`);

    // 1. Mark status as 'printing' (Customer screen updates live!)
    await supabase.from('print_jobs').update({ status: 'printing' }).eq('id', job.id);
    console.log('🔄 Status marked: PRINTING...');

    // 2. Download from Supabase Storage
    if (job.file_path) {
      console.log(`⬇️ Downloading ${job.file_path} from cloud storage...`);
      const { data, error: dlErr } = await supabase.storage
        .from('print-files')
        .download(job.file_path);

      if (dlErr) {
        console.error('Download error:', dlErr.message);
      } else if (data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const localPath = path.join(tempDir, job.file_name || 'print_document.pdf');
        fs.writeFileSync(localPath, buffer);
        console.log(`💾 Spooled locally: ${localPath}`);

        // Virtual printer spooling delay (3 seconds)
        console.log('⏳ Spooling to printer hardware...');
        await new Promise((res) => setTimeout(res, 3000));

        // Delete temporary file from PC disk
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log('🧹 Local temporary copy purged from PC.');
        }

        // 3. Delete permanently from Supabase Cloud Storage
        const { error: delErr } = await supabase.storage
          .from('print-files')
          .remove([job.file_path]);

        if (!delErr) {
          console.log('🛡️ Cloud file permanently deleted from Supabase Storage for customer privacy.');
        }
      }
    } else {
      await new Promise((res) => setTimeout(res, 3000));
    }

    // 4. Mark status as 'completed'
    await supabase
      .from('print_jobs')
      .update({ status: 'completed', file_path: null })
      .eq('id', job.id);

    console.log('✅ Status updated: COMPLETED. Print job finished!\n');
  } catch (err) {
    console.error('Processing failure:', err.message);
  }
}

// Check every 2 seconds smoothly without socket errors
setInterval(checkQueue, 2000);