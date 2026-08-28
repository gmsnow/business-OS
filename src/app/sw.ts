import { installSerwist } from "@serwist/sw";

// @ts-expect-error __SW_MANIFEST injected by @serwist/next
installSerwist({ precacheEntries: self.__SW_MANIFEST });
