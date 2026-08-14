/**
 * Fixed 1:1 OSC path -> variable id mappings that need no parsing
 * (HOG_OSC_SPEC.md §3.5). /hog/status/led/flash is handled separately, as
 * part of the named-button list, since "flash" is also a front-panel button.
 */
export const SYSTEM_PATH_VARIABLES: Readonly<Record<string, string>> = {
  '/hog/system/time': 'system_time',
  '/hog/status/commandline': 'commandline',
}
