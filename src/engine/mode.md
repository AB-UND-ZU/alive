# Test Permissions

Local worlds use the existing test-mode flag. Hosted worlds and network replicas use only the authoritative player admin flag, even when a browser opens with `?test`. The optional actor argument resolves the dialog reader rather than another local character. Server restore clears saved admin flags before startup permissions are applied again.
