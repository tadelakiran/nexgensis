/**
 * Dashboard footer.
 *
 * Carries the one piece of information every page needs to be honest about:
 * DummyJSON does not persist writes, so anything the user changes here lives in
 * this browser only.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-slate-200/70 py-6">
      <p className="mx-auto max-w-7xl px-4 text-center text-xs leading-relaxed text-slate-400 sm:px-6">
        Data from the free DummyJSON API. It does not persist writes, so add, edit and delete
        changes are kept in this browser and can be reset from the header.
      </p>
    </footer>
  );
}
