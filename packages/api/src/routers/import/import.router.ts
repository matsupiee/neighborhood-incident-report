import { moderatorProcedure } from "../../index";
import { runPoliceDataImport } from "../../lib/police-data/importer";

/**
 * 警察オープンデータのインポート操作。
 * モデレーター権限が必要。
 */
export const importRouter = {
  triggerPoliceDataImport: moderatorProcedure.handler(async () => {
    return await runPoliceDataImport();
  }),
};
