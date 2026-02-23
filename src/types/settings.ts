export interface AppSettings {
  default_model: string;
  default_aspect_ratio: string;
  default_duration: string;
  locale: string;
  kie_api_key?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  default_model: 'veo3',
  default_aspect_ratio: '9:16',
  default_duration: '8',
  locale: 'en',
};
