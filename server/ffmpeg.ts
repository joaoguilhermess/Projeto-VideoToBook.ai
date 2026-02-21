/**
 * FFmpeg utilities for audio extraction
 * Handles video to audio conversion for efficient processing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Extract audio from video file using ffmpeg
 * Converts video to MP3 audio for efficient processing
 */
export async function extractAudioFromVideo(
  videoPath: string,
  outputPath?: string
): Promise<string> {
  try {
    // Generate output path if not provided
    const audioPath = outputPath || videoPath.replace(/\.[^.]+$/, '.mp3');
    
    console.log(`[FFmpeg] Extracting audio from: ${videoPath}`);
    console.log(`[FFmpeg] Output audio path: ${audioPath}`);
    
    // Check if video file exists
    try {
      await fs.access(videoPath);
    } catch {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // Extract audio using ffmpeg
    // -q:a 5 = good quality MP3 (128kbps)
    // -y = overwrite output file
    const command = `ffmpeg -i "${videoPath}" -q:a 5 -y "${audioPath}" 2>&1`;
    
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 600000 // 10 minutes timeout
    });
    
    // Check if output file was created
    try {
      const stats = await fs.stat(audioPath);
      console.log(`[FFmpeg] Audio extracted successfully: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    } catch {
      throw new Error(`Failed to create audio file: ${audioPath}`);
    }
    
    return audioPath;
  } catch (error) {
    throw new Error(
      `Failed to extract audio: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract audio from local storage video
 * Handles both absolute and relative paths
 */
export async function extractAudioFromLocalStorage(
  localStoragePath: string
): Promise<string> {
  try {
    // Convert local storage path to absolute path
    let absolutePath: string;
    
    if (localStoragePath.startsWith('/.local-storage/')) {
      // Remove leading slash and join with cwd
      absolutePath = join(process.cwd(), localStoragePath.substring(1));
    } else if (localStoragePath.startsWith('.local-storage/')) {
      // Relative path
      absolutePath = join(process.cwd(), localStoragePath);
    } else {
      // Already absolute
      absolutePath = localStoragePath;
    }
    
    // Generate audio output path in same directory
    const audioPath = absolutePath.replace(/\.[^.]+$/, '.mp3');
    
    console.log(`[FFmpeg] Processing local storage file: ${localStoragePath}`);
    console.log(`[FFmpeg] Absolute path: ${absolutePath}`);
    
    // Extract audio
    await extractAudioFromVideo(absolutePath, audioPath);
    
    // Return relative path for storage
    const relativePath = audioPath.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`[FFmpeg] Relative path: ${relativePath}`);
    
    return relativePath;
  } catch (error) {
    throw new Error(
      `Failed to extract audio from local storage: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if ffmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    console.log('[FFmpeg] ffmpeg is installed');
    return true;
  } catch {
    console.warn('[FFmpeg] ffmpeg is not installed or not in PATH');
    return false;
  }
}
