declare module 'locale-includes' {
  function localeIncludes(str: string, searchString: string, options?: {
    position?: number, locales?: Intl.LocalesArgument
  } & Intl.CollatorOptions): boolean;
}
