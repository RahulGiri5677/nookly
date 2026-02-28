
## Fix: "Nook not found" on NookDetail Page

### Root Cause Analysis

The `NookDetail.tsx` query has two issues that combine to cause the "Nook not found" display:

1. **`(supabase as any)` cast**: The query casts `supabase` to `any` before calling `.from("nooks")`. This was likely added because `google_maps_link` or `nook_code` didn't exist in the TypeScript types at the time. However, these columns are now fully in the types file. The `any` cast **bypasses all TypeScript type checking**, which can mask errors and makes the code brittle.

2. **Missing `isError` handler**: The component only checks `isLoading` and `!nook`, but does **not** check `isError`. In React Query v5, when a query fails (network error, PostgREST column error, etc.):
   - `isLoading` = `false` (query is in `error` state, not `pending`)
   - `data` = `undefined`
   - `isError` = `true`
   
   So the component skips the "Loading..." state and falls straight through to "Nook not found" — even though the query is just erroring out in the background.

3. **Missing columns in the select**: The query does NOT select `category` or `comfort_detail`, but the NookDetail page uses `(nook as any).category` at line 393. These should be included for completeness.

### What Will Be Fixed

**File: `src/pages/NookDetail.tsx`**

- Remove the `(supabase as any)` cast — use the properly typed `supabase` client directly since all columns (`google_maps_link`, `nook_code`, `host_mode_active`) are now in the types
- Add `isError` to the destructured query result
- Add an `isError` check before the `!nook` check, showing a user-friendly error state with a back button instead of the misleading "Nook not found" message
- Add `category` and `comfort_detail` to the SELECT columns so the category badge renders correctly on the detail page

### Technical Details

```text
Current flow when query errors:
  isLoading (false) → skip loading state
  !nook (true, data is undefined) → show "Nook not found." ← WRONG

Fixed flow:
  isLoading (false) → skip loading state  
  isError (true) → show "Something went wrong. Please try again." ← CORRECT
  !nook (true) → show "Nook not found." ← only for genuinely missing nooks
```

The fix is targeted and surgical — only `NookDetail.tsx` needs to be changed. No database changes, no new files.
