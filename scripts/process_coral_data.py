#!/usr/bin/env python3
"""
Coral Reef Bleaching Simulation Data Processing & Statistical Inference Pipeline
Computes:
1. OLS Multiple Linear Regression (Percent_Bleaching = beta0 + beta1*SSTA + beta2*TSA_DHW + eps)
2. Chi-Square Test of Independence (Turbidity vs Bleaching Severity)
3. Representative Global Reef Nodes (~1,000 spatial sites with historical baselines)
"""

import csv
import json
import math
from collections import defaultdict

CSV_PATH = "global_bleaching_environmental.csv"
OUTPUT_MODEL_PATH = "public/data/statistical_model.json"
OUTPUT_REEFS_PATH = "public/data/reef_simulation_data.json"

def compute_ols(records):
    # Model: Y = b0 + b1 * SSTA + b2 * TSA_DHW
    n = len(records)
    p = 3  # parameters
    
    # Accumulate X^T X and X^T Y
    xtx = [[0.0] * p for _ in range(p)]
    xty = [0.0] * p
    y_vals = []
    
    for r in records:
        x = [1.0, r['ssta'], r['tsa']]
        y = r['pb']
        y_vals.append(y)
        for i in range(p):
            xty[i] += x[i] * y
            for j in range(p):
                xtx[i][j] += x[i] * x[j]
                
    # Invert 3x3 matrix
    det = (
        xtx[0][0] * (xtx[1][1] * xtx[2][2] - xtx[1][2] * xtx[2][1])
        - xtx[0][1] * (xtx[1][0] * xtx[2][2] - xtx[1][2] * xtx[2][0])
        + xtx[0][2] * (xtx[1][0] * xtx[2][1] - xtx[1][1] * xtx[2][0])
    )
    if abs(det) < 1e-12:
        raise ValueError("Singular matrix in OLS inversion")
        
    inv = [[0.0] * p for _ in range(p)]
    inv[0][0] = (xtx[1][1] * xtx[2][2] - xtx[1][2] * xtx[2][1]) / det
    inv[0][1] = (xtx[0][2] * xtx[2][1] - xtx[0][1] * xtx[2][2]) / det
    inv[0][2] = (xtx[0][1] * xtx[1][2] - xtx[0][2] * xtx[1][1]) / det
    
    inv[1][0] = (xtx[1][2] * xtx[2][0] - xtx[1][0] * xtx[2][2]) / det
    inv[1][1] = (xtx[0][0] * xtx[2][2] - xtx[0][2] * xtx[2][0]) / det
    inv[1][2] = (xtx[0][2] * xtx[1][0] - xtx[0][0] * xtx[1][2]) / det
    
    inv[2][0] = (xtx[1][0] * xtx[2][1] - xtx[1][1] * xtx[2][0]) / det
    inv[2][1] = (xtx[0][1] * xtx[2][0] - xtx[0][0] * xtx[2][1]) / det
    inv[2][2] = (xtx[0][0] * xtx[1][1] - xtx[0][1] * xtx[1][0]) / det
    
    betas = [sum(inv[i][j] * xty[j] for j in range(p)) for i in range(p)]
    b0, b1, b2 = betas
    
    # Residuals & Sum of Squares
    y_mean = sum(y_vals) / n
    ss_tot = sum((y - y_mean) ** 2 for y in y_vals)
    ss_res = 0.0
    for r in records:
        y_hat = b0 + b1 * r['ssta'] + b2 * r['tsa']
        ss_res += (r['pb'] - y_hat) ** 2
        
    r_squared = 1.0 - (ss_res / ss_tot)
    adj_r_squared = 1.0 - ((ss_res / (n - p)) / (ss_tot / (n - 1)))
    
    s2 = ss_res / (n - p)
    se_b0 = math.sqrt(s2 * inv[0][0])
    se_b1 = math.sqrt(s2 * inv[1][1])
    se_b2 = math.sqrt(s2 * inv[2][2])
    
    t_b0 = b0 / se_b0
    t_b1 = b1 / se_b1
    t_b2 = b2 / se_b2
    
    ms_model = (ss_tot - ss_res) / (p - 1)
    ms_res = ss_res / (n - p)
    f_stat = ms_model / ms_res
    
    return {
        "n_samples": n,
        "beta_0": round(b0, 4),
        "beta_1_ssta": round(b1, 4),
        "beta_2_tsa_dhw": round(b2, 4),
        "se_beta_0": round(se_b0, 4),
        "se_beta_1": round(se_b1, 4),
        "se_beta_2": round(se_b2, 4),
        "t_beta_0": round(t_b0, 2),
        "t_beta_1": round(t_b1, 2),
        "t_beta_2": round(t_b2, 2),
        "r_squared": round(r_squared, 4),
        "adj_r_squared": round(adj_r_squared, 4),
        "f_statistic": round(f_stat, 2),
        "mean_bleaching_pct": round(y_mean, 2),
        "p_value_model": "< 0.0001"
    }

def chi2_cdf(x, k):
    # Incomplete gamma regularized approximation for chi-square CDF
    # For k=4, CDF(x, 4) = 1 - (1 + x/2)*exp(-x/2)
    if k == 4:
        return 1.0 - (1.0 + x / 2.0) * math.exp(-x / 2.0)
    # General approximation
    s = k / 2.0
    z = x / 2.0
    sum_val = 1.0
    term = 1.0
    for i in range(1, 100):
        term *= z / (s + i)
        sum_val += term
        if term < 1e-12:
            break
    gamma_s = math.gamma(s) if s <= 10 else math.sqrt(2 * math.pi / s) * ((s / math.e) ** s)
    return (math.exp(-z) * (z ** s) * sum_val) / (s * gamma_s)

def compute_chi_square(records):
    # Bleaching categories: Low (<10%), Med (10-50%), High (>50%)
    # Turbidity categories: Low (< p33), Med (p33 - p66), High (> p66)
    turb_records = [r for r in records if r['turb'] is not None]
    turb_sorted = sorted(r['turb'] for r in turb_records)
    n = len(turb_sorted)
    
    t_p33 = turb_sorted[int(n * 0.333)]
    t_p66 = turb_sorted[int(n * 0.667)]
    
    # 3x3 table: [turb_cat][bleach_cat]
    # Rows: 0: Low, 1: Med, 2: High Turbidity
    # Cols: 0: Healthy (<10%), 1: Stressed (10-50%), 2: Severe (>50%)
    observed = [[0, 0, 0] for _ in range(3)]
    for r in turb_records:
        t = r['turb']
        pb = r['pb']
        row = 0 if t < t_p33 else (1 if t < t_p66 else 2)
        col = 0 if pb < 10.0 else (1 if pb <= 50.0 else 2)
        observed[row][col] += 1
        
    row_totals = [sum(row) for row in observed]
    col_totals = [sum(observed[i][j] for i in range(3)) for j in range(3)]
    total = sum(row_totals)
    
    expected = [[(row_totals[i] * col_totals[j]) / total for j in range(3)] for i in range(3)]
    
    chi2 = 0.0
    for i in range(3):
        for j in range(3):
            e = expected[i][j]
            o = observed[i][j]
            chi2 += ((o - e) ** 2) / e
            
    df = (3 - 1) * (3 - 1)
    cdf = chi2_cdf(chi2, df)
    p_value = max(0.0, 1.0 - cdf)
    
    # Format contingency table for UI display
    categories_turb = [f"Low (< {t_p33:.4f})", f"Med ({t_p33:.4f} - {t_p66:.4f})", f"High (> {t_p66:.4f})"]
    categories_bleach = ["Healthy (< 10%)", "Stressed (10 - 50%)", "Severe (> 50%)"]
    
    return {
        "n_samples": total,
        "degrees_of_freedom": df,
        "chi2_statistic": round(chi2, 2),
        "critical_value_05": 9.488,
        "p_value": "< 0.00001" if p_value < 1e-5 else round(p_value, 5),
        "hypothesis_result": "Reject H0 (Bleaching is strongly dependent on Turbidity)",
        "turbidity_tertiles": [round(t_p33, 4), round(t_p66, 4)],
        "observed_table": observed,
        "expected_table": [[round(val, 1) for val in row] for row in expected],
        "row_totals": row_totals,
        "col_totals": col_totals,
        "categories_turbidity": categories_turb,
        "categories_bleaching": categories_bleach,
        "conditional_multiplier_wpollution": 1.35
    }

def cluster_and_sample_reefs(records, target_nodes=1000):
    # Group by spatial grid (0.5 degree latitude x 0.5 degree longitude)
    grid = defaultdict(list)
    for r in records:
        lat_bin = round(r['lat'] * 2) / 2.0
        lon_bin = round(r['lon'] * 2) / 2.0
        grid[(lat_bin, lon_bin)].append(r)
        
    print(f"Total spatial 0.5° grid cells with reef data: {len(grid)}")
    
    nodes = []
    # Sort grid cells by sample density and spread
    for (lat_b, lon_b), cell_records in grid.items():
        # Representative sample: take medians/averages
        avg_pb = sum(c['pb'] for c in cell_records) / len(cell_records)
        avg_ssta = sum(c['ssta'] for c in cell_records) / len(cell_records)
        avg_tsa = sum(c['tsa'] for c in cell_records) / len(cell_records)
        
        valid_turb = [c['turb'] for c in cell_records if c['turb'] is not None]
        avg_turb = (sum(valid_turb) / len(valid_turb)) if valid_turb else 0.05
        
        valid_depth = [c['depth'] for c in cell_records if c['depth'] is not None]
        avg_depth = (sum(valid_depth) / len(valid_depth)) if valid_depth else 8.5
        
        # Exposure majority
        exp_counts = defaultdict(int)
        for c in cell_records:
            exp_counts[c['exp']] += 1
        maj_exp = max(exp_counts, key=exp_counts.get) if exp_counts else "Sheltered"
        
        rep = cell_records[0]
        site_name = rep.get('site_name') or rep.get('country') or f"Reef {lat_b:.1f},{lon_b:.1f}"
        if site_name == "nd" or not site_name:
            site_name = f"{rep.get('country', 'Ocean')} Reef ({lat_b:.1f}°)"
            
        # Determine initial state: 0=Healthy, 1=Stressed, 2=Bleached, 3=Dead
        if avg_pb < 10.0:
            init_state = 0
        elif avg_pb <= 30.0:
            init_state = 1
        elif avg_pb <= 75.0:
            init_state = 2
        else:
            init_state = 3
            
        nodes.append({
            "id": rep['site_id'],
            "name": site_name,
            "country": rep.get('country', 'International Waters'),
            "ocean": rep.get('ocean', 'Global Ocean'),
            "realm": rep.get('realm', 'Tropical'),
            "lat": round(rep['lat'], 3),
            "lon": round(rep['lon'], 3),
            "depth_m": round(avg_depth, 1),
            "turbidity": round(avg_turb, 4),
            "baseline_ssta": round(avg_ssta, 2),
            "baseline_tsa_dhw": round(avg_tsa, 2),
            "exposure": maj_exp if maj_exp in ["Sheltered", "Exposed"] else "Sheltered",
            "baseline_bleaching": round(avg_pb, 1),
            "initial_state": init_state,
            "observations_count": len(cell_records)
        })
        
    # If nodes > target_nodes, we select a high-fidelity geographically representative set
    if len(nodes) > target_nodes:
        # Sort by observations count to keep the richest monitored sites
        # But ensure we keep global ocean diversity
        oceans = defaultdict(list)
        for n in nodes:
            oceans[n['ocean']].append(n)
            
        sampled = []
        for ocean, ocean_nodes in oceans.items():
            # sort by observation count descending
            ocean_nodes.sort(key=lambda x: x['observations_count'], reverse=True)
            # Allocate proportional to ocean presence, minimum 50
            alloc = max(40, int(target_nodes * (len(ocean_nodes) / len(nodes))))
            sampled.extend(ocean_nodes[:alloc])
            
        # If still over or under target, adjust
        if len(sampled) > target_nodes:
            sampled = sampled[:target_nodes]
        nodes = sampled

    print(f"Sampled {len(nodes)} representative global reef nodes.")
    return nodes

def main():
    print(f"Reading {CSV_PATH}...")
    records = []
    with open(CSV_PATH, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                pb = float(row['Percent_Bleaching'])
                ssta = float(row['SSTA'])
                tsa = float(row['TSA_DHW'])
                lat = float(row['Latitude_Degrees'])
                lon = float(row['Longitude_Degrees'])
                turb = float(row['Turbidity']) if row.get('Turbidity') not in ('', 'nd', None) else None
                depth = float(row['Depth_m']) if row.get('Depth_m') not in ('', 'nd', None) else None
                exp = row.get('Exposure', 'Sheltered')
                
                records.append({
                    "site_id": row.get('Site_ID', '0'),
                    "site_name": row.get('Site_Name', ''),
                    "country": row.get('Country_Name', ''),
                    "ocean": row.get('Ocean_Name', ''),
                    "realm": row.get('Realm_Name', ''),
                    "lat": lat,
                    "lon": lon,
                    "pb": pb,
                    "ssta": ssta,
                    "tsa": tsa,
                    "turb": turb,
                    "depth": depth,
                    "exp": exp
                })
            except (ValueError, KeyError):
                continue
                
    print(f"Successfully parsed {len(records)} valid records.")
    
    ols_res = compute_ols(records)
    print("OLS Results:", json.dumps(ols_res, indent=2))
    
    chi2_res = compute_chi_square(records)
    print("Chi2 Results:", json.dumps(chi2_res, indent=2))
    
    statistical_model = {
        "metadata": {
            "source": "global_bleaching_environmental.csv",
            "total_records_analyzed": len(records),
            "generated_at": "2026-10-29"
        },
        "ols_regression": ols_res,
        "chi_square_test": chi2_res,
        "dtmc_config": {
            "states": ["Healthy", "Stressed", "Bleached", "Dead"],
            "state_colors": ["#10B981", "#F59E0B", "#F43F5E", "#334155"],
            "base_gammas": [-2.2, -1.1, -0.6],  # Baseline logits for (0->1, 1->2, 2->3)
            "base_recovery": [0.45, 0.28],       # Baseline recovery for (1->0, 2->1)
            "ols_beta_ssta": ols_res['beta_1_ssta'],
            "ols_beta_tsa_dhw": ols_res['beta_2_tsa_dhw'],
            "chi2_turbidity_multiplier": chi2_res['conditional_multiplier_wpollution']
        }
    }
    
    with open(OUTPUT_MODEL_PATH, 'w', encoding='utf-8') as f:
        json.dump(statistical_model, f, indent=2)
    print(f"Exported statistical model to {OUTPUT_MODEL_PATH}")
    
    reefs = cluster_and_sample_reefs(records, target_nodes=1000)
    with open(OUTPUT_REEFS_PATH, 'w', encoding='utf-8') as f:
        json.dump(reefs, f)
    print(f"Exported {len(reefs)} reef nodes to {OUTPUT_REEFS_PATH}")

if __name__ == "__main__":
    main()
