/**
 * Shared test setup.
 *
 * React 18+ requires `IS_REACT_ACT_ENVIRONMENT` before `act()` may be used
 * outside of a testing-framework adapter, otherwise every state update in a hook
 * test logs "the current testing environment is not configured to support act()".
 * Setting it here means the hook tests stay quiet and their warnings meaningful.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;
