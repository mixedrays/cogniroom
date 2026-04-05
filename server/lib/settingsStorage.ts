import { createStorageApi } from "@modules/storage";
import { SETTINGS_DIR } from "@root/server/env";

export const settingsStorage = createStorageApi({ basePath: SETTINGS_DIR });
