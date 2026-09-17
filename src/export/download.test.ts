import { describe, expect, it, vi, beforeEach } from 'vitest'

const isTauriMock = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({ isTauri: isTauriMock }))

describe('downloadTextFile', () => {
  beforeEach(() => {
    isTauriMock.mockReset()
    vi.resetModules()
  })

  it('uses the browser download path outside of Tauri', async () => {
    isTauriMock.mockReturnValue(false)
    const { downloadTextFile } = await import('./download')

    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()

    const result = await downloadTextFile('note.txt', 'hello', 'text/plain')

    expect(result).toBe(true)
    expect(clickSpy).toHaveBeenCalledOnce()

    createElementSpy.mockRestore()
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('routes through the Tauri save dialog + fs adapter when running in Tauri', async () => {
    isTauriMock.mockReturnValue(true)
    const saveMock = vi.fn().mockResolvedValue('C:\\Users\\test\\note.txt')
    const writeTextFileMock = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@tauri-apps/plugin-dialog', () => ({ save: saveMock }))
    vi.doMock('@tauri-apps/plugin-fs', () => ({ writeTextFile: writeTextFileMock }))

    const { downloadTextFile } = await import('./download')
    const result = await downloadTextFile('note.txt', 'hello', 'text/plain')

    expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: 'note.txt' }))
    expect(writeTextFileMock).toHaveBeenCalledWith('C:\\Users\\test\\note.txt', 'hello')
    expect(result).toBe(true)
  })

  it('reports cancellation (false) when the user dismisses the Tauri save dialog', async () => {
    isTauriMock.mockReturnValue(true)
    const saveMock = vi.fn().mockResolvedValue(null)
    const writeTextFileMock = vi.fn()
    vi.doMock('@tauri-apps/plugin-dialog', () => ({ save: saveMock }))
    vi.doMock('@tauri-apps/plugin-fs', () => ({ writeTextFile: writeTextFileMock }))

    const { downloadTextFile } = await import('./download')
    const result = await downloadTextFile('note.txt', 'hello', 'text/plain')

    expect(result).toBe(false)
    expect(writeTextFileMock).not.toHaveBeenCalled()
  })
})
