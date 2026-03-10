import { win32 } from 'node:path';
import { spawn } from 'node:child_process';

export interface LaunchQBittorrentOptions {
  executablePath?: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface LaunchQBittorrentResult {
  platform: NodeJS.Platform;
  command: string;
  args: string[];
  pid?: number;
  attempts: string[];
}

export async function launchQBittorrent(
  options: LaunchQBittorrentOptions = {}
): Promise<LaunchQBittorrentResult> {
  const platform = process.platform;
  const attempts: string[] = [];
  const candidates = resolveLaunchCandidates(platform, options);
  let lastError: unknown;

  for (const candidate of candidates) {
    attempts.push(formatAttempt(candidate.command, candidate.args));
    try {
      const pid = await spawnDetached(candidate.command, candidate.args, {
        cwd: options.cwd,
        env: options.env
      });
      return {
        platform,
        command: candidate.command,
        args: candidate.args,
        pid,
        attempts
      };
    } catch (error) {
      lastError = error;
      if (!isEnoentError(error) || platform !== 'win32') {
        throw error;
      }
    }
  }

  const message = [
    `Failed to launch qBittorrent on ${platform}.`,
    `Attempts: ${attempts.join(', ')}`,
    lastError instanceof Error ? `Last error: ${lastError.message}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  throw new Error(message);
}

interface LaunchCandidate {
  command: string;
  args: string[];
}

function resolveLaunchCandidates(
  platform: NodeJS.Platform,
  options: LaunchQBittorrentOptions
): LaunchCandidate[] {
  const args = options.args ?? [];
  const executablePath = options.executablePath;

  if (executablePath) {
    return [{ command: executablePath, args }];
  }

  if (platform === 'darwin') {
    const openArgs = ['-a', 'qBittorrent'];
    if (args.length > 0) {
      openArgs.push('--args', ...args);
    }
    return [{ command: 'open', args: openArgs }];
  }

  if (platform === 'linux') {
    return [{ command: 'qbittorrent', args }];
  }

  if (platform === 'win32') {
    return [
      { command: 'qbittorrent.exe', args },
      { command: 'qbittorrent', args },
      ...resolveWindowsInstallPathCandidates(args)
    ];
  }

  return [{ command: 'qbittorrent', args }];
}

function resolveWindowsInstallPathCandidates(args: string[]): LaunchCandidate[] {
  const candidates: LaunchCandidate[] = [];
  const programFiles = process.env.ProgramFiles;
  const programFilesX86 = process.env['ProgramFiles(x86)'];

  if (programFiles) {
    candidates.push({
      command: win32.join(programFiles, 'qBittorrent', 'qbittorrent.exe'),
      args
    });
  }
  if (programFilesX86) {
    candidates.push({
      command: win32.join(programFilesX86, 'qBittorrent', 'qbittorrent.exe'),
      args
    });
  }

  return candidates;
}

function spawnDetached(
  command: string,
  args: string[],
  options: Pick<LaunchQBittorrentOptions, 'cwd' | 'env'>
): Promise<number | undefined> {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });

  return new Promise((resolve, reject) => {
    const onSpawn = () => {
      cleanup();
      child.unref();
      resolve(child.pid);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      child.off('spawn', onSpawn);
      child.off('error', onError);
    };

    child.once('spawn', onSpawn);
    child.once('error', onError);
  });
}

function isEnoentError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT';
}

function formatAttempt(command: string, args: string[]): string {
  if (args.length === 0) {
    return command;
  }
  return `${command} ${args.join(' ')}`;
}
