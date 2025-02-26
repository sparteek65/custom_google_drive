import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageTransferServiceClient } from '@google-cloud/storage-transfer';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
) {
  console.log('Transfer request received');

  try {
    const { sourceUrl, folderName } = await req.json();

    // Initialize Storage Transfer Service client with credentials
    const client = new StorageTransferServiceClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    // Create a transfer job
    const [response] = await client.createTransferJob({
      transferJob: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        description: `Transfer from ${sourceUrl}`,
        status: 'ENABLED',
        transferSpec: {
          httpDataSource: {
            listUrl: sourceUrl
          },
          gcsDataSink: {
            bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME,
            path: folderName
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Transfer job created successfully',
      jobId: response.name
    }, { status: 200 });
  } catch (error) {
    console.error('Transfer job creation failed:', error);
    return NextResponse.json({ message: 'Failed to create transfer job' }, { status: 500 });
  }
} 