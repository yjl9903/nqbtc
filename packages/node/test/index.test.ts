import { EventEmitter } from 'node:events';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  spawn: spawnMock
}));

import { launchQBittorrent } from '../src/index.js';

type MockChild = EventEmitter & {
  pid?: number;
  unref: ReturnType<typeof vi.fn>;
};

function createMockChild(pid?: number): MockChild {
  const child = new EventEmitter() as MockChild;
  child.pid = pid;
  child.unref = vi.fn();
  return child;
}

function createEnoentError(message: string): NodeJS.ErrnoException {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  return error;
}

describe('launchQBittorrent', () => {
  let platformSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    spawnMock.mockReset();
    platformSpy = vi.spyOn(process, 'platform', 'get');
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    platformSpy.mockRestore();
    process.env = originalEnv;
  });

  it('uses macOS open command by default', async () => {
    platformSpy.mockReturnValue('darwin');
    const child = createMockChild(101);
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => child.emit('spawn'));
      return child;
    });

    const result = await launchQBittorrent();

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      'open',
      ['-a', 'qBittorrent'],
      expect.objectContaining({
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      })
    );
    expect(result).toEqual({
      platform: 'darwin',
      command: 'open',
      args: ['-a', 'qBittorrent'],
      pid: 101,
      attempts: ['open -a qBittorrent']
    });
    expect(child.unref).toHaveBeenCalledTimes(1);
  });

  it('passes args on macOS via --args', async () => {
    platformSpy.mockReturnValue('darwin');
    const child = createMockChild(102);
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => child.emit('spawn'));
      return child;
    });

    const result = await launchQBittorrent({ args: ['--profile=/tmp/qb'] });

    expect(spawnMock).toHaveBeenCalledWith(
      'open',
      ['-a', 'qBittorrent', '--args', '--profile=/tmp/qb'],
      expect.anything()
    );
    expect(result.command).toBe('open');
    expect(result.args).toEqual(['-a', 'qBittorrent', '--args', '--profile=/tmp/qb']);
  });

  it('uses qbittorrent command on linux', async () => {
    platformSpy.mockReturnValue('linux');
    const child = createMockChild(201);
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => child.emit('spawn'));
      return child;
    });

    const result = await launchQBittorrent({ args: ['--webui-port=8080'] });

    expect(spawnMock).toHaveBeenCalledWith(
      'qbittorrent',
      ['--webui-port=8080'],
      expect.anything()
    );
    expect(result).toEqual({
      platform: 'linux',
      command: 'qbittorrent',
      args: ['--webui-port=8080'],
      pid: 201,
      attempts: ['qbittorrent --webui-port=8080']
    });
  });

  it('falls back to Program Files path on Windows after ENOENT', async () => {
    platformSpy.mockReturnValue('win32');
    process.env.ProgramFiles = 'C:\\Program Files';
    process.env['ProgramFiles(x86)'] = 'C:\\Program Files (x86)';

    spawnMock
      .mockImplementationOnce(() => {
        const child = createMockChild();
        queueMicrotask(() => child.emit('error', createEnoentError('not found')));
        return child;
      })
      .mockImplementationOnce(() => {
        const child = createMockChild();
        queueMicrotask(() => child.emit('error', createEnoentError('not found')));
        return child;
      })
      .mockImplementationOnce(() => {
        const child = createMockChild(301);
        queueMicrotask(() => child.emit('spawn'));
        return child;
      });

    const result = await launchQBittorrent();

    expect(spawnMock).toHaveBeenNthCalledWith(1, 'qbittorrent.exe', [], expect.anything());
    expect(spawnMock).toHaveBeenNthCalledWith(2, 'qbittorrent', [], expect.anything());
    expect(spawnMock).toHaveBeenNthCalledWith(
      3,
      'C:\\Program Files\\qBittorrent\\qbittorrent.exe',
      [],
      expect.anything()
    );
    expect(result).toEqual({
      platform: 'win32',
      command: 'C:\\Program Files\\qBittorrent\\qbittorrent.exe',
      args: [],
      pid: 301,
      attempts: [
        'qbittorrent.exe',
        'qbittorrent',
        'C:\\Program Files\\qBittorrent\\qbittorrent.exe'
      ]
    });
  });

  it('throws immediately on non-ENOENT errors on Windows', async () => {
    platformSpy.mockReturnValue('win32');
    const accessDenied = new Error('access denied') as NodeJS.ErrnoException;
    accessDenied.code = 'EACCES';

    spawnMock.mockImplementation(() => {
      const child = createMockChild();
      queueMicrotask(() => child.emit('error', accessDenied));
      return child;
    });

    await expect(launchQBittorrent()).rejects.toThrow('access denied');
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it('respects explicit executablePath on any platform', async () => {
    platformSpy.mockReturnValue('linux');
    const child = createMockChild(401);
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => child.emit('spawn'));
      return child;
    });

    const result = await launchQBittorrent({
      executablePath: '/custom/qbittorrent',
      args: ['--profile=/data/qb']
    });

    expect(spawnMock).toHaveBeenCalledWith(
      '/custom/qbittorrent',
      ['--profile=/data/qb'],
      expect.anything()
    );
    expect(result.command).toBe('/custom/qbittorrent');
  });
});
