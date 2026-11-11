# Markdown

Parses a fetched Markdown page in the browser. The route registry resolves relative documentation links; game fences and inline references use the existing React components. Invalid links and scene names produce a readable page error.

Prism supplies syntax tokens. Only names present in the source-reference index receive code links; strings, comments, property accesses and declaration names remain ordinary code. Copy uses the original fenced text.
