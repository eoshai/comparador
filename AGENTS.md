<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Quick categories map to representative search terms through the existing submit flow; they are search shortcuts, not exhaustive API category filters.
- Use the extracted supplied logo through its asset pointer; derive the public favicon from the same artwork to keep branding consistent.
- Pre-optimize the shared Button's Radix Slot dependency in Vite to avoid mid-session dependency-graph reloads when a route first imports it.
