st frequency is $f_{N,\mathrm{in}}=f_s/2$. The controls and
time plot are implemented in Step1Signal.jsx
and TimePlot.jsx.
## 2. Frequency representation
The discrete-time angular frequency of a tone is:
$$\omega_i=2\pi\frac{f_i}{f_s}\quad\text{radians/sample}$$
Discrete-time frequency is periodic because:
$$\omega\equiv\omega+2\pi r,\qquad r\in\mathbb{Z}$$
This periodicity is the source of aliasing. The displayed spectrum bars are
drawn by SpectrumPlot.jsx;
they show configured tones and do not calculate an FFT.
## 3. FIR low-pass filter
designFIR() creates an odd-length, windowed-sinc FIR filter. Let $N$ be the
number of taps and $M_h=(N-1)/2$. With $q=n-M_h$ and normalized cutoff
$f_{c,\mathrm{norm}}=f_c/f_s$, the ideal impulse response is:
$$h_{\mathrm{ideal}}[n]=
\begin{cases}
2\dfrac{f_c}{f_s}, & q=0\\[6pt]
\dfrac{\sin\left(2\pi\dfrac{f_c}{f_s}q\right)}{\pi q}, & q\ne0
\end{cases}$$
The Hamming window is:
$$w[n]=0.54-0.46\cos\left(\frac{2\pi n}{N-1}\right)$$
Coefficients are windowed and normalized:
$$	ilde h[n]=h_{\mathrm{ideal}}[n]w[n],\qquad
h[n]=\frac{\tilde h[n]}{\sum_{m=0}^{N-1}\tilde h[m]}$$
This is implemented in signalProcessing.js.
The filter controls and pipeline are in Step3LPF.jsx.
## 4. Filter response and filtered signal
The complex FIR response at frequency $f$ is:
$$H(f)=\sum_{n=0}^{N-1}h[n]e^{-j2\pi fn/f_s}$$
Its magnitude is:
$$|H(f)|=\sqrt{\operatorname{Re}\{H(f)\}^2+\operatorname{Im}\{H(f)\}^2}$$
filterGainAt() computes this gain and computeFilterResponse() creates the
curve. Each tone amplitude is changed to:
$$A_{i,\mathrm{filtered}}=A_i|H(f_i)|$$
The displayed filtered signal is therefore:
$$x_f[n]=\sum_{i=1}^{K}A_i|H(f_i)|
\sin\left(2\pi f_i\frac{n}{f_s}\right)$$
The main simulation models steady-state tone attenuation using the frequency
response; it does not convolve the displayed signal in the main path. The
separate applyFIR() helper contains direct FIR convolution for reference, so
phase, group delay, and startup transients are not shown in the main display.
The transition-width estimate shown in the UI is:
$$\Delta f\approx3.3\frac{f_s}{N}$$
It is implemented by transitionWidth().
## 5. Downsampling and decimation
Decimation by integer factor $M$ keeps every $M$-th filtered sample:
$$y[k]=x_f[kM]$$
The output rate and new Nyquist frequency are:
$$f_{s,\mathrm{out}}=\frac{f_s}{M},\qquad
f_{N,\mathrm{out}}=\frac{f_s}{2M}$$
downsample() implements the array operation. The calculations are in
DecimationContext.jsx, and the animation
is in DecimationSampleAnimation.jsx.
For the default $f_s=1200$ Hz and $M=3$:
$$f_{s,\mathrm{out}}=400\text{ Hz},\qquad f_{N,\mathrm{out}}=200\text{ Hz}$$
## 6. Aliasing and frequency folding
The anti-aliasing LPF should attenuate content above the new Nyquist frequency:
$$X_f(f)\approx0\quad\text{for}\quad |f|>\frac{f_s}{2M}$$
For a tone above this limit, foldFreq() first computes:
$$f_r=f\bmod f_{s,\mathrm{out}}$$
and then reflects it into the output Nyquist band:
$$f_{\mathrm{alias}}=
\begin{cases}
f_r, & f_r\leq f_{s,\mathrm{out}}/2\\[4pt]
f_{s,\mathrm{out}}-f_r, & f_r>f_{s,\mathrm{out}}/2
\end{cases}$$
Equivalent compact form:
$$f_{\mathrm{alias}}=\left|\left(\left(f+\frac{f_{s,\mathrm{out}}}{2}\right)\bmod f_{s,\mathrm{out}}\right)-\frac{f_{s,\mathrm{out}}}{2}\right|$$
For the default 500 Hz tone:
$$500\bmod400=100\text{ Hz}$$
Thus, without filtering, 500 Hz appears as a false 100 Hz component, while
150 Hz remains 150 Hz. The animation is in
AliasingAnimation.jsx, and the
final comparison is in Step4Decimate.jsx.
## 7. Spectral explanation
For decimation by $M$, the output spectrum is a sum of shifted and compressed
copies of the filtered input spectrum:
$$Y(e^{j\omega})=\frac{1}{M}\sum_{r=0}^{M-1}
X_f\left(e^{j(\omega+2\pi r)/M}\right)$$
If these copies overlap, their components become indistinguishable: this is
aliasing. The LPF prevents overlap by limiting the signal to approximately
$|f|\leq f_s/(2M)$ before decimation.
## 8. Imaging
Imaging is the related problem caused by upsampling, not by the downsampling
operation implemented here. Upsampling by $L$ inserts zeros:
$$x_u[n]=
\begin{cases}
x[n/L], & n=0,\pm L,\pm2L,\ldots\\
0, & \text{otherwise}
\end{cases}$$
The new rate is $f_{s,\mathrm{up}}=Lf_s$, and repeated spectral images appear.
A reconstruction LPF is then used to remove those images. This application does
not perform upsampling or numerically draw image spectra; it focuses on the
complementary anti-aliasing problem of filtering before decimation.
## Default worked example
The default signal is:
$$x[n]=1.0\sin\left(2\pi\frac{150}{1200}n\right)
+0.8\sin\left(2\pi\frac{500}{1200}n\right)$$
With $M=3$, the output rate is 400 Hz and the new Nyquist frequency is 200 Hz.
Without the LPF:
$$150\text{ Hz}\rightarrow150\text{ Hz},\qquad
500\text{ Hz}\rightarrow100\text{ Hz alias}$$
With the LPF first, the 500 Hz tone is attenuated before every third sample is
kept, so only permitted in-band content reaches the output.