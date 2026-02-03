export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const data = req.body;

  console.log('EdfaPay Callback:', data);

  return res.status(200).json({ status: 'received' });
}
