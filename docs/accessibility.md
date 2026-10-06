# Accessibility statement and test scope

Design target: applicable WCAG 2.2 AA. This build does not claim certified or complete conformance.

Implemented: native semantic controls, unique labels, descriptions, error alert and invalid input state, visible focus, skip link, result focus after deliberate calculation, polite atomic result announcement, table row/column headers, text profit state and explanations. Text preferences, 44px primary controls, flexible widths, narrow reflow, reduced motion and forced-color styling are included. No sliders, hover-only actions, animated meaning or clickable divs.

Automated checks: axe-core on initial and expanded/calculated states; keyboard simulation; 190px reflow as a 200% side-panel approximation, optional 125% text, reduced motion and forced colors. See qa-report.md for actual results. Automation is not a screen-reader test and narrow viewport emulation is not proof of native Chrome zoom.

Manual release script:

1. Load extension in supported Chrome and open native side panel from toolbar. Use only Tab/Shift-Tab/Enter/Space through every control, including reset, save, export and deletion cancellation. Focus must never trap or disappear.
2. Enable VoiceOver on macOS with Chrome. Complete manual and detected-price calculations. Hear meaningful field labels, accessible validation, result amount/currency/order scope, state, fee assumptions, breakdown table and promotion comparison. Record Chrome/macOS/VoiceOver versions, tester and defects. NVDA on Windows is a later additional target.
3. At actual Chrome 200% zoom, verify all important controls and amounts remain available without two-dimensional scrolling. Repeat with large text, low contrast sensitivity and forced colors. Read profit states without color.
4. Confirm reduced motion and pointer/touch target behavior. Test 44px controls with limited precision.
5. Recruit real people with relevant accessibility needs; do not infer user success from developer tests.

No VoiceOver session or real assistive-technology user evaluation has been completed by this build workflow. Those are submission blockers. All defects preventing basic no-mouse tasks, understandable screen-reader results or visible controls at 200% zoom must be fixed before release.
