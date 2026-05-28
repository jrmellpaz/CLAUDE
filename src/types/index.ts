export interface PanelRow {
  region: string;
  month: string;
  dailyWage: number;
  ricePrice: number;
  riceWmPrice: number;
  eggPrice: number;
  fishPrice: number;
  porkPrice: number;
  // Cereals & grains
  cornWhitePrice: number;
  cornYellowPrice: number;
  monggoPrice: number;
  // Root crops
  camotePrice: number;
  cassavaPrice: number;
  gabiPrice: number;
  potatoPrice: number;
  singkamasPrice: number;
  // Leafy vegetables
  kangkongPrice: number;
  pechayNativePrice: number;
  pechayChinesePrice: number;
  alugbatiPrice: number;
  gabiLeavesPrice: number;
  malunggayPrice: number;
  onionLeavesPrice: number;
  cabbagePrice: number;
  // Fruit vegetables
  tomatoPrice: number;
  talongPrice: number;
  ampalayaPrice: number;
  sayotePrice: number;
  upoPrice: number;
  squashPrice: number;
  okraPrice: number;
  pipinoPrice: number;
  patolaPrice: number;
  stringBeansPrice: number;
  baguioBeansPrice: number;
  // Other vegetables / aromatics
  carrotPrice: number;
  labanosPrice: number;
  onionRedPrice: number;
  onionWhitePrice: number;
  garlicPrice: number;
  gingerPrice: number;
  // Fish & seafood
  tilapiaPrice: number;
  bangusPrice: number;
  dilisPrice: number;
  tulinganPrice: number;
  budburonPrice: number;
  barilisPrice: number;
  tahongPrice: number;
  gulamanDagatPrice: number;
  latoPrice: number;
  // Meat & poultry
  chickenNativePrice: number;
  edibleOffalPrice: number;
  // Derived
  dailyBasketPp: number;
  dailyBasketHh: number;
  monthlyBasket: number;
  daysToFeed: number;
  realWage: number;
  cpiAll: number;
  cpiB30: number;
  householdSize: number;
  riceShare: number;
  wageBasketGap: number;
  [key: string]: string | number;
}

export type BasketCategory =
  | "Grains & staples"
  | "Root crops"
  | "Leafy vegetables"
  | "Fruit vegetables"
  | "Other vegetables"
  | "Fish & seafood"
  | "Meat & poultry";

export interface BasketItem {
  key: keyof PanelRow;
  label: string;
  unit: string;
  defaultQty: number;
  qty: number;
  enabled: boolean;
  category: BasketCategory;
}

export interface CustomParams {
  baseRegion: string;
  dailyWage: number;
  householdSize: number;
}

export interface RegressionCoef {
  value: number;
  std_err: number;
  p_value: number;
}

export interface FeatureImportance {
  feature: string;
  std_coef: number;
  rank: number;
}

export interface RegressionResult {
  r_squared: number;
  adj_r_squared: number;
  rmse: number;
  coefficients: Record<string, RegressionCoef>;
  feature_importance: FeatureImportance[];
  summary_text: string;
}
