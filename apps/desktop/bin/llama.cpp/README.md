# llama.cpp runtime

Place platform-specific `llama-server` binaries in this directory before
packaging the desktop app. The app first checks a platform subdirectory:

```text
win32-x64/llama-server.exe
darwin-arm64/llama-server
darwin-x64/llama-server
linux-x64/llama-server
```

Expected runtime names:

- Windows: `llama-server.exe`
- macOS/Linux: `llama-server`

Development can also use `AI_IMPORT_LLAMA_SERVER_PATH` to point at a local
binary outside this folder.

The checked-in `win32-x64` runtime is from the official llama.cpp release:

```text
https://github.com/ggml-org/llama.cpp/releases/download/b9360/llama-b9360-bin-win-cpu-x64.zip
```

The checked-in macOS runtimes are from the official llama.cpp release:

```text
https://github.com/ggml-org/llama.cpp/releases/download/b9360/llama-b9360-bin-macos-arm64.tar.gz
https://github.com/ggml-org/llama.cpp/releases/download/b9360/llama-b9360-bin-macos-x64.tar.gz
```

The macOS archives contain dylib symlinks. Because this repository was prepared
on Windows, those symlink names are stored as regular file copies. The build
script sets executable bits before running electron-builder on macOS/Linux.
