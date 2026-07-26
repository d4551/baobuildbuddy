export type JobProviderForm = {
  providerTimeoutMs: number;
  companyBoardResultLimit: number;
  gamingBoardResultLimit: number;
  unknownLocationLabel: string;
  unknownCompanyLabel: string;
  greenhouseApiBaseUrl: string;
  greenhouseMaxPages: number;
  leverApiBaseUrl: string;
  leverMaxPages: number;
  greenhouseBoardsJson: string;
  leverCompaniesJson: string;
  companyBoardsJson: string;
  companyBoardApiTemplatesJson: string;
  gamingPortalsJson: string;
};

export type JobTaxonomyForm = {
  keywordsJson: string;
  studioRulesJson: string;
};
