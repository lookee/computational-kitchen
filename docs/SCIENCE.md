# Model notebook — equations, units, limits

The running application's **Formule matematiche** section is the detailed, executable documentation. It shows current values, MathML equations and LaTeX source. This document gives the stable overview; changes to code and these notes must agree.

## 1. Mass balance

All ingredient masses are in grams. Hydration $H$ is entered as a percentage, while $h=H/100$ is a flour-relative ratio. Salt is fixed at $s=0.025$ (2.5% of flour); it is not an input. Oil $o$ is a flour-relative ratio: the Neapolitan preset uses zero, the home-style preset uses 0.02 and a custom preset supports 0–5%. The 2% preset is a design choice, not a universal standard.

For $N$ dough balls of mass $m$, total mass is $M=Nm$:

$$F=\frac{M}{1+h+s+o+q},\qquad W=hF,\quad S=sF,\quad O=oF,\quad Y=qF.$$

The denominator includes fresh yeast $q=Y/F$. An indirect dough splits flour into prefermented and new flour. With fraction $r$ prefermented, and yeast ratios $y_p,y_f$ on the corresponding flour portions:

$$q=r y_p+(1-r)y_f,\quad F_p=rF,\quad Y_p=y_pF_p,\quad Y_f=y_f(F-F_p).$$

Preferment hydration determines its water; the final mix receives the remaining water. Poolish uses 100% hydration; the biga input supports 45–60%. The app rejects combinations that require more water than available. Indirect yeast doses are manual recipe parameters, not automatically inferred preferment maturity.

## 2. Empirical fresh-yeast estimate

The direct method implements the relation referenced to the [Calcolapizza website](https://laconfraternitadellapizza.net/calcolapizza/):

$$G(H,s_L,o_L)=\frac{(1+s_L/200)(1+o_L/300)}{4.2H-80-0.0305H^2}$$

$$q=\frac{2250G(H,s_L,o_L)}{T^{2.5}(t-0.9t_f)^{1.2}}.$$

Here $H$ is hydration in percentage points, $T$ is ambient temperature in °C, $t$ and $t_f$ are hours, and $s_L,o_L$ are grams of salt/oil per litre of water. These legacy units differ from baker's ratios: $s_L=1000s/h$ and $o_L=1000o/h$.

This is an empirical formula, **not dimensionally universal physical law**. Its Celsius input and fitted constants are part of the model. One refrigerator hour contributes effectively 0.1 warm hour in this relation, regardless of the exact refrigerator setting. The formula is not evidence of validation over every allowed UI combination.

## 3. Experimental thermal extension

For a constant environment $T_e$ during a phase, dough temperature follows a first-order relaxation:

$$T_d(t)=T_e+(T_0-T_e)e^{-t/\tau}.$$

Relative activity referenced to 20 °C is:

$$a(T_d)=\exp\left[-\frac{E_a}{R}\left(\frac{1}{T_d+273.15}-\frac{1}{293.15}\right)\right],\qquad E=\int a(T_d(t))\,dt.$$

The implementation numerically integrates phase activity and scales the empirical baseline dose by $(24/E)^\beta$, with a composition correction through $G$. $E_a$ is entered in kJ/mol and converted to J/mol; $\tau$ is in hours. The default $E_a=55$, $\tau=2$, $\beta=1.2$ are assumptions. This extension is **experimental and not fitted to measurements from the selected flour**.

## 4. Rise-and-loss-of-strength curves

The chart combines a simulated development proxy with a simulated loss of structural retention. Its W-to-capacity relation, curve shapes, recommended threshold and sensitivity bands are explicit **heuristic design choices**. Protein, P/L, farinograph stability and Falling Number are reference data, not silently converted into hours.

The plotted optimum is relative to those assumptions, yeast dose and temperature schedule. It is not a measured maximum volume, probability, confidence interval, digestibility score or guaranteed safe flour window. The ±30% capacity band is a sensitivity exploration. Personal calibration maps the display to observations; it does not establish biological validity.

Exploring the chart changes no recipe parameters until **Use this duration** is confirmed. Confirmation retains the selected start/bake reference and the fixed yeast-to-flour ratio. A past preparation start is rejected. **Recalculate yeast** is the explicit dose recalculation action. Changing other recipe inputs updates the model; a resulting curve change is not new experimental evidence.

## 5. Process and precision

Autolyse is a flour/water preparation, separate from direct/poolish/biga method selection. It does not intentionally ferment and does not modify the yeast formula. Refrigerator use and automatic final-proof scheduling are process choices. Proof duration is a scheduling heuristic constrained by the available time; it is editable.

Machine actions are personalised adaptations for TM5/TM6/TM7, not manufacturer-certified programmes. Bigas are combined roughly by hand; they are not kneaded into a developed dough with Spiga. Observe actual consistency, temperature and appliance limits.

Internal calculations retain full floating-point values. Weighing totals are rounded and apportioned over batches to preserve those totals. Yeast display resolution is 0.1 g; quantities below that need finer weighing. Display precision is not predictive accuracy.

Times use **Europe/Rome**, including daylight-saving checks. Total programme duration includes preparation and the last pizza; fermentation hours are a different interval. Batch preparation, autolyse, preferment and baking can extend the total programme beyond the entered post-mix duration.

## 6. What would make this more scientific?

Record flour lot, yeast type and storage, dough temperature over time, pH, volume/gas retention, actual durations and extensibility. Compare predictions against held-out observations and report errors and useful ranges. Do not claim that a W value, visually pleasing curve or passing software test validates a fermentation model.

Flour source links and technical details live in the app's formula/catalogue section. Manufacturer specifications may change; missing data must remain missing. Scientific references and third-party attributions are listed separately in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
