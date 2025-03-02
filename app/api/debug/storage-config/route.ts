import { NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storageService';

export async function GET() {
  try {
    // Get basic storage configuration without exposing sensitive data
    const config = {
      defaultBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'Not configured',
      storageInitialized: !!storageService.storage,
      serviceAccountConfigured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                               !!process.env.FIREBASE_SERVICE_ACCOUNT,
      environment: process.env.NODE_ENV,
      // Test basic functionality
      canListFiles: false
    };
    
    // Test if we can list files (basic functionality check)
    try {
      await storageService.listFiles('', 1);
      config.canListFiles = true;
    } catch (e) {
      config.canListFiles = false;
    }
    
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get storage config', details: String(error) },
      { status: 500 }
    );
  }
} 