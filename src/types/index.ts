export interface PanelRow {
  region: string;
  month: string;
  dailyWage: number;
  ricePrice: number;
  riceWmPrice: number;
  eggPrice: number;
  fishPrice: number;
  porkPrice: number;
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

export interface BasketItem {
  key: keyof PanelRow;
  label: string;
  unit: string;
  defaultQty: number;
  qty: number;
  enabled: boolean;
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
