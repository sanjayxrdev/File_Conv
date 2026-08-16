# Security Policy — FILE CONV

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in FILE CONV, please report it responsibly by opening a private security issue or contacting the project maintainers directly.

## Security Controls Implemented

1. **Subprocess Shell Safety**:
   All external executions (e.g. FFmpeg, Poppler) strictly use argument arrays (`asyncio.create_subprocess_exec(*cmd)`). Command strings are NEVER formatted via raw string interpolation.

2. **File Name & Path Sanitization**:
   User filenames are stripped of non-alphanumeric characters, and all temporary filesystem operations occur within isolated UUID directories. Path traversal patterns (`../`, `..\`) are strictly rejected.

3. **Rate & Size Enforcement**:
   Upload file sizes are bounded (default 250MB limit), and conversion executions enforce time-outs (default 180 seconds).

4. **Automatic Cleanup**:
   Background tasks continuously purge temporary conversion artifacts older than 60 minutes.
