const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zpebqgkpbmfwcrkolcxs.supabase.co', 'sb_publishable_-GNFiDARWwNFlhwYh4yDeA_13fhNgTX');
async function test() {
  const { data, error } = await supabase.storage.createBucket('receipts', { public: true });
  console.log('Create Bucket:', error ? error.message : 'Created successfully!');
}
test();
