const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zpebqgkpbmfwcrkolcxs.supabase.co', 'sb_publishable_-GNFiDARWwNFlhwYh4yDeA_13fhNgTX');
async function test() {
  const { data, error } = await supabase.storage.getBucket('receipts');
  console.log('Bucket check:', error ? error.message : 'Exists!');
}
test();
