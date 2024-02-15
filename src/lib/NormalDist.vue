<template>
    
</template>
<script>
export default {
    data (){
        return {
            /** Static Variables */
            a: [2.2352520354606839287e00,1.6102823106855587881e02,1.0676894854603709582e03,
      			1.8154981253343561249e04,6.5682337918207449113e-2],
            b: [4.7202581904688241870e01,9.7609855173777669322e02,1.0260932208618978205e04,
      			4.5507789335026729956e04],
            c: [3.9894151208813466764e-1,8.8831497943883759412e00,9.3506656132177855979e01,
				5.9727027639480026226e02,2.4945375852903726711e03,6.8481904505362823326e03,
				1.1602651437647350124e04,9.8427148383839780218e03,1.0765576773720192317e-8],
            d: [2.2266688044328115691e01,2.3538790178262499861e02,1.5193775994075548050e03,
				6.4855582982667607550e03,1.8615571640885098091e04,3.4900952721145977266e04,
				3.8912003286093271411e04,1.9685429676859990727e04],
            half: 0.5e0,
            p: [2.1589853405795699e-1,1.274011611602473639e-1,2.2235277870649807e-2,
      			1.421619193227893466e-3,2.9112874951168792e-5,2.307344176494017303e-2],
            one: 1.0e0,
            OneOverRoot2Pi: 1.0 / Math.sqrt(2 * Math.PI),
            mean_: null,
            sigma_: null,
            // Once we have the mean and variance, the following are constants
            // that are needed to evaluate the pdf.
            oneOverSigma_: null,
            oneOverSigmaSqr_: null,
            // c_ is just oneOverSigma_*OneOverRoot2Pi
            c_: null,
        }
    },
    props: ['mean', 'var'],
    beforeMount() {
        this.Variance = this.var;
    },
    methods: {
        /**
         * <summary> Returns the probability density function evaluated at a given value. </summary>
         * <param name="x">A position on the x-axis.</param>
         * <returns>The probability density function evaluated at <c>x</c>.</returns>
         */
        PDF(x) {
            let y = (x - this.mean);
            let xMinusMuSqr = y * y;
            // c_ is a constant equal to one over sigma times one over square root of 2 PI
            return this.c_ * Math.exp(-0.5 * xMinusMuSqr * this.oneOverSigmaSqr_);
        },
        CDF(x) {
            let k = 1 / (1 + 0.2316419 * Math.abs(x));
            let a1 = 0.319381530; let a2 = -0.356563782; let a3 = 1.781477937;
            let a4 = -1.821255978; let a5 = 1.330274429;
            let result = this.NDF(x) * (a1 * k + a2 * Math.pow(k, 2) + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5)) - 0.5;
            result = 0.5 - result * Math.sign(x);
            return result;
        },
        NDF(x) {
            return Math.exp(-x * x / 2) / Math.sqrt(8 * Math.atan(1));
        }
    },
    watch: {
        var(nv) {
            this.Variance = nv;
        }
    },
    computed: {
        /**
         * <summary> Gets and sets the variance of the density. </summary>
         * <exception cref="Exception">Thrown if the variance is less than or equal to zero.</exception>
         * <remarks>The variance of the density is the standard deviation squared.</remarks>
         */
        Variance: {
            set: function(value) {
                if (value <= 0.0){
                    console.log("Expected variance > 0 in NormalDistribution. Found variance = ", value);
                }
                this.sigma_ = Math.sqrt(value);
                this.oneOverSigma_ = 1.0 / this.sigma_;
                this.oneOverSigmaSqr_ = this.oneOverSigma_ * this.oneOverSigma_;
                this.c_ = this.oneOverSigma_ * this.OneOverRoot2Pi;
            },
            get: function() {return (this.sigma_ * this.sigma_);},
        },
        /**
         * <summary> Gets the skewness, a measure of the degree of asymmetry of this density. </summary>
         * <remarks> The skewness is the third central moment divided by the cube of the standard deviation. </remarks>
         */
        Skewness() {return 0.0},
        /**
         * <summary> Gets the kurtosis, a measure of the degree of peakednesss of the density. </summary>
         * <remarks> The kurtosis is the fourth centeral moment divided by the fouth power of the standard deviation, normalized so that
         * the kurtosis if the normal density is zero. </remarks>
         */
        Kurtosis() {return 0.0},
    },
/* 
namespace PropCalculator
{
    /// <summary>
    /// Class NormalDist represents the normal (Gaussian) probability distribution
    /// with a specifed mean and variance.
    /// </summary>
    public class NormalDist
    {
        // #region Static Variables ------------------------------------------------

        CONST MACHINE_EPSILON = 1.0e-12;

        let a = [2.2352520354606839287e00,1.6102823106855587881e02,1.0676894854603709582e03,
      			1.8154981253343561249e04,6.5682337918207449113e-2];

        let b = [4.7202581904688241870e01,9.7609855173777669322e02,1.0260932208618978205e04,
      			4.5507789335026729956e04];
				  
        let c = [3.9894151208813466764e-1,8.8831497943883759412e00,9.3506656132177855979e01,
				5.9727027639480026226e02,2.4945375852903726711e03,6.8481904505362823326e03,
				1.1602651437647350124e04,9.8427148383839780218e03,1.0765576773720192317e-8];

        let d = [2.2266688044328115691e01,2.3538790178262499861e02,1.5193775994075548050e03,
				6.4855582982667607550e03,1.8615571640885098091e04,3.4900952721145977266e04,
				3.8912003286093271411e04,1.9685429676859990727e04];
        CONST half = 0.5e0;

        let p = [2.1589853405795699e-1,1.274011611602473639e-1,2.2235277870649807e-2,
      			1.421619193227893466e-3,2.9112874951168792e-5,2.307344176494017303e-2];

        CONST one = 1.0e0;

        let q = [1.28426009614491121e00,4.68238212480865118e-1,6.59881378689285515e-2,
     			 3.78239633202758244e-3,7.29751555083966205e-5];

        CONST sixten = 1.60e0;
        CONST sqrpi = 3.9894228040143267794e-1;
        CONST thrsh = 0.66291e0;
        CONST root32 = 5.656854248e0;
        CONST zero = 0.0e0;

        CONST OneOverRoot2Pi = 1.0 / Math.Sqrt(2 * Math.PI);

        // #endregion Static Variables


        // #region Instance Variables ----------------------------------------------

        let mean_;
        let sigma_;
        // Once we have the mean and variance, the following are constants
        // that are needed to evaluate the pdf.
        let oneOverSigma_;
        let oneOverSigmaSqr_;
        // c_ is just oneOverSigma_*OneOverRoot2Pi
        let c_;

        // #endregion Instance Variables


        // #region Constructors ----------------------------------------------------

        /// <summary>
        /// Constructs a NormalDist instance with the given mean and variance.
        /// </summary>
        /// <param name="mean">The mean of the density.</param>
        /// <param name="var">The variance of the density. Must be positive.</param>
        /// <exception cref="Exception">Thrown if the variance is less 
        /// than or equal to zero.</exception>
        /// <remarks>The variance of the distribution is the standard deviation squared.</remarks>
        public NormalDist(mean, var)
        {
            this.mean_ = mean;
            this.Variance = var;
        }

        // #endregion Constructors


        /// <summary>
        /// Gets and sets the variance of the density.
        /// </summary>
        /// <exception cref="Exception">Thrown if the variance is less 
        /// than or equal to zero.</exception>
        /// <remarks>The variance of the density is the standard deviation squared.</remarks>
        public double Variance
        {
            get
            {
                return (sigma_ * sigma_);
            }

            set
            {
                if (value <= 0.0)
                {
                    string msg = string.Format("Expected variance > 0 in NormalDistribution. Found variance = {0}", value);
                    throw new Exception(msg);
                }
                sigma_ = Math.Sqrt(value);
                oneOverSigma_ = 1.0 / sigma_;
                oneOverSigmaSqr_ = oneOverSigma_ * oneOverSigma_;
                c_ = oneOverSigma_ * OneOverRoot2Pi;
            }
        }

        /// <summary>
        /// Gets the skewness, a measure of the degree of asymmetry of 
        /// this density. 
        /// </summary>
        /// <remarks>
        /// The skewness is the third central moment divided by the cube of 
        /// the standard deviation.
        /// </remarks>
        public double Skewness
        {
            get
            {
                return 0.0;
            }
        }

        /// <summary>
        /// Gets the kurtosis, a measure of the degree of peakednesss of the
        /// density.
        /// </summary>
        /// <remarks>
        /// The kurtosis is the fourth centeral moment divided by the
        /// fouth power of the standard deviation, normalized so that
        /// the kurtosis if the normal density is zero. 
        /// </remarks>
        public double Kurtosis
        {
            get
            {
                return 0.0;
            }
        }

        #endregion Properties


        #region Member Functions ------------------------------------------------

        /// <summary>
        /// Returns the probability density function evaluated at a given value.
        /// </summary>
        /// <param name="x">A position on the x-axis.</param>
        /// <returns>The probability density function evaluated at <c>x</c>.</returns>
        public double PDF(double x)
        {
            double y = (x - mean_);
            double xMinusMuSqr = y * y;

            // c_ is a constant equal to one over sigma times one over square root of 2 PI
            return c_ * Math.Exp(-0.5 * xMinusMuSqr * oneOverSigmaSqr_);
        }

        /// <summary>
        /// Returns the cumulative density function evaluated at a given value.
        /// </summary>
        /// <param name="x">A position on the x-axis.</param>
        /// <returns>The cumulative density function evaluated at <c>x</c>.</returns>
        /// <remarks>The value of the cumulative density function at a point <c>x</c> is
        /// probability that the value of a random variable having this normal density is
        /// less than or equal to <c>x</c>.
        /// </remarks>
        //public double CDF(double x)
        //{
        //    // This algorithm is ported from dcdflib:
        //    // Cody, W.D. (1993). "ALGORITHM 715: SPECFUN - A Portabel FORTRAN
        //    // Package of Special Function Routines and Test Drivers"
        //    // acm Transactions on Mathematical Software. 19, 22-32.
        //    int i;
        //    double del, temp, z, xden, xnum, y, xsq, min;
        //    double result, ccum;
        //    double arg = (x - mean_) / sigma_;

        //    min = Double.Epsilon;
        //    z = arg;
        //    y = Math.Abs(z);
        //    if (y <= thrsh)
        //    {
        //        //
        //        // Evaluate  anorm  for  |X| <= 0.66291
        //        //
        //        xsq = zero;
        //        if (y > MACHINE_EPSILON) xsq = z * z;
        //        xnum = a[4] * xsq;
        //        xden = xsq;
        //        for (i = 0; i < 3; i++)
        //        {
        //            xnum = (xnum + a[i]) * xsq;
        //            xden = (xden + b[i]) * xsq;
        //        }
        //        result = z * (xnum + a[3]) / (xden + b[3]);
        //        temp = result;
        //        result = half + temp;
        //        ccum = half - temp;
        //    }

        //    //
        //    // Evaluate  anorm  for 0.66291 <= |X| <= sqrt(32)
        //    //
        //    else if (y <= root32)
        //    {
        //        xnum = c[8] * y;
        //        xden = y;
        //        for (i = 0; i < 7; i++)
        //        {
        //            xnum = (xnum + c[i]) * y;
        //            xden = (xden + d[i]) * y;
        //        }
        //        result = (xnum + c[7]) / (xden + d[7]);
        //        xsq = Math.Floor(y * sixten) / sixten;
        //        del = (y - xsq) * (y + xsq);
        //        result = Math.Exp(-(xsq * xsq * half)) * Math.Exp(-(del * half)) * result;
        //        ccum = one - result;
        //        if (z > zero)
        //        {
        //            temp = result;
        //            result = ccum;
        //            ccum = temp;
        //        }
        //    }

        //    //
        //    // Evaluate  anorm  for |X| > sqrt(32)
        //    //
        //    else
        //    {
        //        result = zero;
        //        xsq = one / (z * z);
        //        xnum = p[5] * xsq;
        //        xden = xsq;
        //        for (i = 0; i < 4; i++)
        //        {
        //            xnum = (xnum + p[i]) * xsq;
        //            xden = (xden + q[i]) * xsq;
        //        }
        //        result = xsq * (xnum + p[4]) / (xden + q[4]);
        //        result = (sqrpi - result) / y;
        //        xsq = Math.Floor(z * sixten) / sixten;
        //        del = (z - xsq) * (z + xsq);
        //        result = Math.Exp(-(xsq * xsq * half)) * Math.Exp(-(del * half)) * result;
        //        ccum = one - result;
        //        if (z > zero)
        //        {
        //            temp = result;
        //            result = ccum;
        //            ccum = temp;
        //        }
        //    }

        //    if (result < min) result = 0.0e0;
        //    //
        //    // Fix up for negative argument, erf, etc.
        //    //
        //    if (ccum < min) ccum = 0.0e0;

        //    return result;
        //}
        public double CDF(double x)
        {
            double k = 1 / (1 + 0.2316419 * Math.Abs(x));
            double a1 = 0.319381530; double a2 = -0.356563782; double a3 = 1.781477937;
            double a4 = -1.821255978; double a5 = 1.330274429;
            double result = NDF(x) * (a1 * k + a2 * Math.Pow(k, 2) + a3 * Math.Pow(k, 3) + a4 * Math.Pow(k, 4) + a5 * Math.Pow(k, 5)) - 0.5;
            result = 0.5 - result * Math.Sign(x);

            return result;
        }

        double NDF(double x)
        {
            return Math.Exp(-x * x / 2) / Math.Sqrt(8 * Math.Atan(1));
        }

        #endregion Member Functions

    }
}
*/
}
</script>

