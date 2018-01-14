import OperationConfig from "../config/MetaConfig.js";
import Utils from "../Utils.js";
import FileType from "../operations/FileType.js";


/**
 * A class for detecting encodings, file types and byte frequencies.
 *
 * @author n1474335 [n1474335@gmail.com]
 * @copyright Crown Copyright 2018
 * @license Apache-2.0
 *
 * @class
 */
class Magic {

    /**
     * Magic constructor.
     *
     * @param {ArrayBuffer} buf
     */
    constructor(buf) {
        this.inputBuffer = new Uint8Array(buf);
        this.inputStr = Utils.arrayBufferToStr(buf);
        this.opPatterns = Magic._generateOpPatterns();

        // Match against known encodings
        //  findMatchingOps
        // Match against known file types
        //  detectFileType
        // Match against byte frequencies
        //  detectLanguage
        // Report info to user
        // Offer to run various recipes based on findings
    }

    /**
     * Finds operations that claim to be able to decode the input based on regular
     * expression matches.
     *
     * @returns {Object[]}
     */
    findMatchingOps() {
        let matches = [];

        for (let i = 0; i < this.opPatterns.length; i++) {
            let pattern = this.opPatterns[i];
            const regex = new RegExp(pattern.match, pattern.flags);
            if (regex.test(this.inputStr)) {
                matches.push(pattern);
            }
        }

        return matches;
    }

    /**
     * Attempts to detect the language of the input by comparing its byte frequency
     * to that of several known languages.
     *
     * @returns {Object[]}
     */
    detectLanguage() {
        const inputFreq = this._freqDist();
        let chiSqrs = [];

        for (let lang in LANG_FREQS) {
            chiSqrs.push({
                lang: lang,
                chiSqr: Magic._chiSqr(inputFreq, LANG_FREQS[lang])
            });
        }

        chiSqrs.sort((a, b) => {
            return a.chiSqr - b.chiSqr;
        });

        return chiSqrs;
    }

    /**
     * Detects any matching file types for the input.
     * 
     * @returns {Object} type
     * @returns {string} type.ext - File extension
     * @returns {string} type.mime - Mime type
     * @returns {string} [type.desc] - Description
     */
    detectFileType() {
        return FileType.magicType(this.inputBuffer);
    }

    /**
     * Calculates the number of times each byte appears in the input
     *
     * @private
     * @returns {number[]}
     */
    _freqDist() {
        const len = this.inputBuffer.length;
        let i = len,
            counts = new Array(256).fill(0);

        if (!len) return counts;

        while (i--) {
            counts[this.inputBuffer[i]]++;
        }

        return counts.map(c => {
            return c / len * 100;
        });
    }

    /**
     * Generates a list of all patterns that operations claim to be able to decode.
     *
     * @private
     * @static
     * @returns {Object[]}
     */
    static _generateOpPatterns() {
        let opPatterns = [];

        for (let op in OperationConfig) {
            if (!OperationConfig[op].hasOwnProperty("patterns")) continue;

            OperationConfig[op].patterns.forEach(pattern => {
                opPatterns.push({
                    op: op,
                    match: pattern.match,
                    flags: pattern.flags,
                    args: pattern.args
                });
            });
        }

        return opPatterns;
    }

    /**
     * Calculates Pearson's Chi-Squared test for two frequency arrays.
     * https://en.wikipedia.org/wiki/Pearson%27s_chi-squared_test
     *
     * @private
     * @static
     * @param {number[]} observed 
     * @param {number[]} expected 
     * @returns {number}
     */
    static _chiSqr(observed, expected) {
        let tmp,
            res = 0;

        for (let i = 0; i < observed.length; i++) {
            tmp = observed[i] - expected[i];
            res += tmp * tmp / expected[i];
        }
        return res;
    }

}

/**
 * Byte frequencies of various languages generated from Wikipedia dumps taken in late 2017.
 * The Chi-Squared test cannot accept expected values of 0, so 0.0001 has been used to account
 * for bytes that do not normally appear in the language.
 * 
 * @constant
 */
const LANG_FREQS = {
    "ar": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.65, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 9.194, 0.002, 0.102, 0.0001, 0.0001, 0.007, 0.001, 0.002, 0.109, 0.108, 0.002, 0.001, 0.03, 0.046, 0.42, 0.018, 0.182, 0.202, 0.135, 0.063, 0.065, 0.061, 0.055, 0.053, 0.062, 0.113, 0.054, 0.001, 0.002, 0.003, 0.002, 0.0001, 0.0001, 0.01, 0.006, 0.009, 0.007, 0.005, 0.004, 0.004, 0.004, 0.005, 0.002, 0.002, 0.005, 0.007, 0.005, 0.004, 0.007, 0.001, 0.005, 0.009, 0.006, 0.002, 0.002, 0.002, 0.001, 0.001, 0.001, 0.007, 0.001, 0.007, 0.0001, 0.004, 0.0001, 0.052, 0.008, 0.019, 0.018, 0.055, 0.008, 0.011, 0.016, 0.045, 0.001, 0.006, 0.028, 0.016, 0.037, 0.04, 0.012, 0.001, 0.038, 0.03, 0.035, 0.02, 0.006, 0.006, 0.002, 0.009, 0.002, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.055, 1.131, 0.874, 0.939, 4.804, 2.787, 2.235, 1.018, 2.407, 0.349, 3.542, 0.092, 0.4, 0.007, 0.051, 0.053, 0.022, 0.061, 0.01, 0.008, 0.001, 0.001, 0.0001, 0.001, 0.001, 0.001, 0.0001, 0.008, 0.001, 0.001, 0.0001, 0.002, 0.013, 0.133, 0.049, 0.782, 0.037, 0.335, 0.157, 6.208, 1.599, 1.486, 1.889, 0.276, 0.607, 0.762, 0.341, 1.38, 0.239, 2.041, 0.293, 1.149, 0.411, 0.383, 0.246, 0.406, 0.094, 1.401, 0.223, 0.006, 0.001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.027, 0.003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.003, 0.001, 0.003, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.002, 23.298, 20.414, 0.003, 0.004, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.0001, 0.019, 0.001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "de": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.726, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 13.303, 0.002, 0.278, 0.0001, 0.0001, 0.007, 0.003, 0.005, 0.149, 0.149, 0.015, 0.001, 0.636, 0.237, 0.922, 0.023, 0.305, 0.472, 0.225, 0.115, 0.11, 0.121, 0.108, 0.11, 0.145, 0.271, 0.049, 0.022, 0.002, 0.002, 0.002, 0.001, 0.0001, 0.413, 0.383, 0.144, 0.412, 0.275, 0.258, 0.273, 0.218, 0.18, 0.167, 0.277, 0.201, 0.328, 0.179, 0.111, 0.254, 0.012, 0.219, 0.602, 0.209, 0.1, 0.185, 0.206, 0.005, 0.01, 0.112, 0.002, 0.0001, 0.002, 0.0001, 0.006, 0.0001, 4.417, 1.306, 1.99, 3.615, 12.382, 1.106, 2.0, 2.958, 6.179, 0.082, 0.866, 2.842, 1.869, 7.338, 2.27, 0.606, 0.016, 6.056, 4.424, 4.731, 3.002, 0.609, 0.918, 0.053, 0.169, 0.824, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.147, 0.002, 0.003, 0.001, 0.006, 0.001, 0.001, 0.002, 0.001, 0.001, 0.0001, 0.0001, 0.001, 0.004, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.03, 0.0001, 0.0001, 0.009, 0.001, 0.002, 0.009, 0.002, 0.001, 0.061, 0.0001, 0.048, 0.122, 0.057, 0.009, 0.001, 0.001, 0.4, 0.001, 0.002, 0.003, 0.003, 0.017, 0.001, 0.003, 0.001, 0.005, 0.0001, 0.001, 0.003, 0.002, 0.003, 0.005, 0.001, 0.001, 0.203, 0.0001, 0.002, 0.001, 0.002, 0.002, 0.438, 0.002, 0.002, 0.001, 0.0001, 0.0001, 0.056, 1.237, 0.01, 0.013, 0.0001, 0.0001, 0.001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.003, 0.001, 0.005, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.148, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "en": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.755, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 15.843, 0.004, 0.375, 0.002, 0.008, 0.019, 0.008, 0.134, 0.137, 0.137, 0.001, 0.001, 0.972, 0.19, 0.857, 0.017, 0.334, 0.421, 0.246, 0.108, 0.104, 0.112, 0.103, 0.1, 0.127, 0.237, 0.04, 0.027, 0.004, 0.003, 0.004, 0.002, 0.0001, 0.338, 0.218, 0.326, 0.163, 0.121, 0.149, 0.133, 0.192, 0.232, 0.107, 0.082, 0.148, 0.248, 0.134, 0.103, 0.195, 0.012, 0.162, 0.368, 0.366, 0.077, 0.061, 0.127, 0.009, 0.03, 0.015, 0.004, 0.0001, 0.004, 0.0001, 0.003, 0.0001, 6.614, 1.039, 2.327, 2.934, 9.162, 1.606, 1.415, 3.503, 5.718, 0.081, 0.461, 3.153, 1.793, 5.723, 5.565, 1.415, 0.066, 5.036, 4.79, 6.284, 1.992, 0.759, 1.176, 0.139, 1.162, 0.102, 0.0001, 0.002, 0.0001, 0.0001, 0.0001, 0.06, 0.004, 0.003, 0.002, 0.001, 0.001, 0.001, 0.002, 0.001, 0.001, 0.0001, 0.001, 0.001, 0.003, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.031, 0.006, 0.001, 0.001, 0.001, 0.002, 0.014, 0.001, 0.001, 0.005, 0.005, 0.001, 0.002, 0.017, 0.007, 0.002, 0.003, 0.004, 0.002, 0.001, 0.002, 0.002, 0.012, 0.001, 0.002, 0.001, 0.004, 0.001, 0.001, 0.003, 0.003, 0.002, 0.005, 0.001, 0.001, 0.003, 0.001, 0.003, 0.001, 0.002, 0.001, 0.004, 0.001, 0.002, 0.001, 0.0001, 0.0001, 0.02, 0.047, 0.009, 0.009, 0.0001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.003, 0.001, 0.004, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.005, 0.002, 0.061, 0.001, 0.0001, 0.002, 0.001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "es": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.757, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 15.771, 0.003, 0.315, 0.001, 0.004, 0.019, 0.003, 0.014, 0.132, 0.133, 0.001, 0.001, 0.976, 0.078, 0.703, 0.014, 0.268, 0.331, 0.197, 0.095, 0.086, 0.095, 0.085, 0.084, 0.105, 0.183, 0.053, 0.027, 0.001, 0.002, 0.002, 0.002, 0.0001, 0.242, 0.129, 0.28, 0.129, 0.322, 0.105, 0.099, 0.077, 0.116, 0.074, 0.034, 0.209, 0.196, 0.086, 0.059, 0.187, 0.009, 0.118, 0.247, 0.128, 0.061, 0.072, 0.033, 0.023, 0.018, 0.013, 0.005, 0.0001, 0.005, 0.0001, 0.003, 0.0001, 8.9, 0.939, 3.234, 4.015, 9.642, 0.603, 0.891, 0.531, 5.007, 0.262, 0.107, 4.355, 1.915, 5.487, 6.224, 1.805, 0.423, 4.992, 5.086, 3.402, 2.878, 0.667, 0.044, 0.125, 0.673, 0.299, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.033, 0.009, 0.002, 0.002, 0.001, 0.001, 0.001, 0.001, 0.001, 0.003, 0.0001, 0.001, 0.001, 0.003, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.006, 0.006, 0.001, 0.0001, 0.001, 0.001, 0.003, 0.001, 0.001, 0.008, 0.008, 0.001, 0.001, 0.025, 0.274, 0.002, 0.002, 0.002, 0.001, 0.001, 0.002, 0.002, 0.221, 0.003, 0.019, 0.001, 0.373, 0.001, 0.001, 0.005, 0.144, 0.01, 0.631, 0.002, 0.001, 0.002, 0.001, 0.002, 0.001, 0.102, 0.018, 0.006, 0.002, 0.002, 0.002, 0.0001, 0.0001, 0.079, 1.766, 0.003, 0.005, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.005, 0.002, 0.008, 0.003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.002, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.002, 0.001, 0.032, 0.001, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "fr": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.894, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 15.162, 0.003, 0.276, 0.0001, 0.0001, 0.012, 0.002, 0.638, 0.153, 0.153, 0.001, 0.002, 0.96, 0.247, 0.715, 0.011, 0.225, 0.339, 0.18, 0.084, 0.081, 0.086, 0.081, 0.084, 0.106, 0.194, 0.063, 0.018, 0.003, 0.002, 0.003, 0.002, 0.0001, 0.208, 0.141, 0.255, 0.128, 0.144, 0.1, 0.095, 0.071, 0.154, 0.072, 0.042, 0.331, 0.173, 0.077, 0.056, 0.167, 0.013, 0.108, 0.214, 0.102, 0.049, 0.062, 0.035, 0.009, 0.014, 0.011, 0.003, 0.0001, 0.003, 0.0001, 0.004, 0.0001, 5.761, 0.627, 2.287, 3.136, 10.738, 0.723, 0.838, 0.669, 5.295, 0.172, 0.12, 4.204, 1.941, 5.522, 4.015, 2.005, 0.584, 5.043, 5.545, 5.13, 4.06, 0.906, 0.051, 0.295, 0.278, 0.085, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.136, 0.003, 0.004, 0.002, 0.001, 0.001, 0.001, 0.002, 0.001, 0.034, 0.0001, 0.0001, 0.001, 0.004, 0.001, 0.0001, 0.001, 0.001, 0.001, 0.019, 0.003, 0.0001, 0.0001, 0.001, 0.001, 0.112, 0.001, 0.002, 0.001, 0.001, 0.0001, 0.001, 0.367, 0.007, 0.034, 0.001, 0.003, 0.001, 0.003, 0.046, 0.303, 1.817, 0.082, 0.045, 0.001, 0.004, 0.029, 0.017, 0.004, 0.002, 0.002, 0.005, 0.038, 0.001, 0.003, 0.0001, 0.002, 0.02, 0.002, 0.054, 0.004, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.113, 2.813, 0.007, 0.026, 0.0001, 0.0001, 0.001, 0.001, 0.0001, 0.001, 0.0001, 0.0001, 0.003, 0.001, 0.005, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.122, 0.001, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "hi": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.374, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 7.123, 0.002, 0.071, 0.0001, 0.001, 0.004, 0.0001, 0.023, 0.08, 0.08, 0.0001, 0.001, 0.255, 0.072, 0.052, 0.006, 0.068, 0.07, 0.044, 0.02, 0.019, 0.023, 0.019, 0.019, 0.021, 0.04, 0.021, 0.006, 0.001, 0.002, 0.001, 0.001, 0.0001, 0.008, 0.004, 0.007, 0.004, 0.005, 0.003, 0.004, 0.003, 0.006, 0.001, 0.002, 0.003, 0.005, 0.004, 0.003, 0.005, 0.0001, 0.003, 0.008, 0.005, 0.002, 0.002, 0.002, 0.001, 0.001, 0.001, 0.007, 0.0001, 0.008, 0.0001, 0.001, 0.0001, 0.049, 0.007, 0.017, 0.016, 0.052, 0.008, 0.01, 0.017, 0.038, 0.001, 0.004, 0.024, 0.015, 0.034, 0.035, 0.012, 0.001, 0.033, 0.03, 0.034, 0.015, 0.005, 0.005, 0.002, 0.008, 0.001, 0.0001, 0.005, 0.0001, 0.0001, 0.0001, 1.039, 0.443, 1.278, 0.061, 0.0001, 0.273, 0.146, 1.879, 0.535, 0.214, 0.013, 0.729, 0.054, 1.826, 0.0001, 0.253, 0.014, 0.012, 0.0001, 0.042, 0.14, 2.07, 0.133, 0.43, 0.035, 0.004, 0.215, 0.046, 0.503, 0.014, 0.016, 0.269, 0.037, 0.213, 0.023, 0.155, 24.777, 7.162, 0.554, 0.224, 1.23, 0.009, 0.8, 0.117, 0.393, 0.245, 0.995, 0.828, 2.018, 0.001, 0.771, 0.001, 0.001, 0.707, 0.299, 0.18, 1.226, 0.94, 0.0001, 0.0001, 0.133, 0.001, 2.558, 1.303, 0.0001, 0.0001, 0.008, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.002, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 30.261, 0.0001, 0.024, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "it": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.828, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 14.918, 0.002, 0.385, 0.0001, 0.001, 0.007, 0.003, 0.383, 0.13, 0.131, 0.0001, 0.001, 0.948, 0.103, 0.657, 0.014, 0.252, 0.332, 0.195, 0.093, 0.089, 0.095, 0.088, 0.084, 0.098, 0.183, 0.061, 0.035, 0.006, 0.002, 0.006, 0.001, 0.0001, 0.215, 0.131, 0.235, 0.125, 0.08, 0.104, 0.125, 0.057, 0.24, 0.04, 0.038, 0.208, 0.179, 0.133, 0.054, 0.164, 0.025, 0.114, 0.256, 0.12, 0.052, 0.079, 0.038, 0.021, 0.012, 0.012, 0.002, 0.0001, 0.002, 0.0001, 0.005, 0.0001, 8.583, 0.65, 3.106, 3.081, 8.81, 0.801, 1.321, 0.694, 8.492, 0.02, 0.115, 5.238, 1.88, 5.659, 6.812, 1.981, 0.236, 4.962, 3.674, 5.112, 2.35, 1.107, 0.055, 0.027, 0.118, 0.709, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.022, 0.004, 0.002, 0.002, 0.001, 0.001, 0.001, 0.002, 0.013, 0.001, 0.0001, 0.0001, 0.001, 0.004, 0.0001, 0.0001, 0.001, 0.001, 0.0001, 0.006, 0.001, 0.0001, 0.001, 0.001, 0.001, 0.005, 0.0001, 0.001, 0.005, 0.005, 0.0001, 0.001, 0.153, 0.007, 0.001, 0.001, 0.003, 0.001, 0.001, 0.002, 0.174, 0.033, 0.004, 0.009, 0.036, 0.004, 0.001, 0.001, 0.006, 0.003, 0.097, 0.004, 0.001, 0.001, 0.003, 0.001, 0.002, 0.056, 0.009, 0.007, 0.004, 0.002, 0.002, 0.002, 0.0001, 0.0001, 0.043, 0.574, 0.01, 0.009, 0.0001, 0.0001, 0.001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.005, 0.002, 0.007, 0.003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.002, 0.021, 0.001, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "ps": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.579, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 11.932, 0.004, 0.044, 0.0001, 0.0001, 0.003, 0.0001, 0.002, 0.118, 0.118, 0.001, 0.001, 0.026, 0.037, 0.443, 0.009, 0.022, 0.03, 0.021, 0.014, 0.011, 0.012, 0.01, 0.009, 0.01, 0.013, 0.062, 0.001, 0.002, 0.005, 0.002, 0.0001, 0.0001, 0.015, 0.007, 0.011, 0.007, 0.006, 0.005, 0.004, 0.007, 0.009, 0.002, 0.003, 0.005, 0.01, 0.006, 0.004, 0.009, 0.001, 0.006, 0.013, 0.009, 0.003, 0.002, 0.003, 0.001, 0.001, 0.001, 0.004, 0.0001, 0.004, 0.0001, 0.003, 0.0001, 0.147, 0.023, 0.055, 0.054, 0.165, 0.027, 0.031, 0.061, 0.131, 0.002, 0.012, 0.073, 0.048, 0.109, 0.113, 0.034, 0.002, 0.103, 0.097, 0.116, 0.047, 0.015, 0.017, 0.005, 0.027, 0.004, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.103, 0.528, 0.202, 0.231, 2.393, 1.822, 2.655, 3.163, 4.608, 0.307, 2.451, 0.006, 1.513, 0.136, 0.015, 0.009, 1.675, 0.004, 0.009, 0.507, 0.005, 0.0001, 0.154, 0.001, 0.093, 0.002, 0.229, 0.007, 0.005, 0.003, 0.0001, 0.006, 0.024, 0.025, 0.048, 0.014, 0.025, 0.008, 0.038, 4.145, 0.839, 1.375, 1.43, 0.077, 0.25, 0.229, 0.647, 2.983, 0.085, 2.528, 0.449, 1.14, 0.525, 0.146, 0.073, 0.106, 0.064, 0.333, 0.407, 0.02, 0.265, 0.005, 1.278, 0.002, 0.0001, 0.0001, 0.016, 0.003, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.002, 0.001, 0.028, 0.011, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 16.081, 19.012, 3.763, 3.368, 0.0001, 0.0001, 0.0001, 0.0001, 0.003, 0.0001, 0.026, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.038, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "pt": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.934, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 15.319, 0.004, 0.372, 0.001, 0.002, 0.012, 0.004, 0.016, 0.15, 0.15, 0.001, 0.002, 1.16, 0.21, 0.746, 0.022, 0.296, 0.361, 0.226, 0.106, 0.098, 0.105, 0.096, 0.094, 0.114, 0.207, 0.054, 0.022, 0.006, 0.004, 0.006, 0.002, 0.0001, 0.345, 0.166, 0.295, 0.143, 0.233, 0.136, 0.112, 0.077, 0.129, 0.093, 0.039, 0.119, 0.217, 0.135, 0.164, 0.222, 0.016, 0.14, 0.259, 0.142, 0.064, 0.078, 0.041, 0.021, 0.013, 0.012, 0.007, 0.0001, 0.007, 0.0001, 0.007, 0.0001, 9.026, 0.717, 2.572, 4.173, 8.551, 0.751, 0.906, 0.629, 5.107, 0.172, 0.12, 2.357, 3.189, 4.024, 7.683, 1.87, 0.445, 5.017, 5.188, 3.559, 2.852, 0.875, 0.055, 0.186, 0.122, 0.257, 0.0001, 0.002, 0.0001, 0.0001, 0.0001, 0.034, 0.01, 0.003, 0.003, 0.001, 0.001, 0.001, 0.001, 0.001, 0.014, 0.001, 0.001, 0.001, 0.005, 0.001, 0.0001, 0.001, 0.001, 0.001, 0.009, 0.006, 0.0001, 0.0001, 0.001, 0.001, 0.003, 0.001, 0.001, 0.007, 0.007, 0.0001, 0.001, 0.079, 0.267, 0.045, 0.508, 0.002, 0.001, 0.001, 0.424, 0.003, 0.417, 0.113, 0.003, 0.001, 0.255, 0.001, 0.001, 0.005, 0.003, 0.015, 0.161, 0.032, 0.087, 0.003, 0.001, 0.002, 0.001, 0.095, 0.002, 0.005, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.067, 2.471, 0.004, 0.006, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.004, 0.002, 0.007, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.033, 0.002, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "ru": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.512, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 7.274, 0.002, 0.063, 0.0001, 0.001, 0.009, 0.001, 0.001, 0.118, 0.118, 0.0001, 0.001, 0.595, 0.135, 0.534, 0.009, 0.18, 0.281, 0.15, 0.078, 0.076, 0.077, 0.068, 0.066, 0.083, 0.16, 0.036, 0.016, 0.002, 0.001, 0.002, 0.001, 0.0001, 0.013, 0.009, 0.014, 0.009, 0.007, 0.006, 0.007, 0.006, 0.031, 0.002, 0.003, 0.007, 0.012, 0.007, 0.005, 0.01, 0.001, 0.008, 0.017, 0.011, 0.003, 0.009, 0.005, 0.012, 0.001, 0.001, 0.001, 0.0001, 0.001, 0.0001, 0.003, 0.0001, 0.065, 0.009, 0.022, 0.021, 0.074, 0.01, 0.013, 0.019, 0.054, 0.001, 0.008, 0.036, 0.02, 0.047, 0.055, 0.013, 0.001, 0.052, 0.037, 0.041, 0.026, 0.007, 0.006, 0.003, 0.011, 0.003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 2.469, 2.363, 2.342, 0.986, 0.156, 0.422, 0.252, 0.495, 0.217, 0.136, 0.014, 0.778, 0.56, 0.097, 0.251, 0.811, 0.09, 0.184, 0.165, 0.06, 0.179, 0.021, 0.013, 0.029, 0.05, 0.005, 0.116, 0.045, 0.087, 0.073, 0.067, 0.124, 0.211, 0.16, 0.055, 0.033, 0.036, 0.024, 0.013, 0.02, 0.022, 0.002, 0.0001, 0.1, 0.0001, 0.025, 0.009, 0.011, 3.536, 0.619, 1.963, 0.833, 1.275, 3.452, 0.323, 0.635, 3.408, 0.642, 1.486, 1.967, 1.26, 2.857, 4.587, 1.082, 0.0001, 0.0001, 0.339, 0.003, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.013, 0.0001, 0.002, 0.001, 31.356, 12.318, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.131, 0.0001, 0.0001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "ur": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.979, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 11.161, 0.002, 0.04, 0.0001, 0.0001, 0.001, 0.0001, 0.006, 0.157, 0.157, 0.0001, 0.001, 0.081, 0.085, 0.055, 0.007, 0.121, 0.179, 0.119, 0.082, 0.072, 0.073, 0.068, 0.065, 0.07, 0.096, 0.098, 0.002, 0.004, 0.003, 0.004, 0.0001, 0.0001, 0.02, 0.016, 0.035, 0.016, 0.006, 0.007, 0.013, 0.009, 0.011, 0.009, 0.012, 0.015, 0.025, 0.011, 0.007, 0.016, 0.003, 0.012, 0.029, 0.016, 0.005, 0.006, 0.007, 0.001, 0.005, 0.003, 0.004, 0.0001, 0.004, 0.0001, 0.004, 0.0001, 0.265, 0.03, 0.059, 0.059, 0.181, 0.032, 0.039, 0.075, 0.194, 0.006, 0.027, 0.102, 0.048, 0.197, 0.175, 0.037, 0.004, 0.142, 0.109, 0.147, 0.083, 0.021, 0.026, 0.005, 0.049, 0.011, 0.0001, 0.014, 0.0001, 0.0001, 0.0001, 0.055, 2.387, 0.534, 0.013, 1.581, 2.193, 2.297, 0.009, 2.712, 0.004, 0.024, 0.012, 4.725, 0.004, 0.025, 0.025, 0.036, 0.091, 1.735, 0.008, 0.507, 0.001, 0.001, 0.002, 0.02, 0.012, 0.0001, 0.005, 0.005, 0.004, 0.001, 0.005, 0.009, 0.069, 0.224, 0.005, 0.08, 0.002, 0.401, 5.353, 1.186, 2.395, 1.412, 0.054, 0.699, 0.376, 0.232, 1.576, 0.068, 2.734, 0.325, 1.531, 0.466, 0.218, 0.1, 0.222, 0.073, 1.112, 0.88, 0.012, 0.002, 0.002, 1.074, 0.003, 0.0001, 0.0001, 0.008, 0.011, 0.003, 0.003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.005, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.002, 18.028, 10.547, 4.494, 8.618, 0.0001, 0.0001, 0.0001, 0.0001, 0.005, 0.001, 0.049, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.043, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
    "zh": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 1.074, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.273, 0.003, 0.045, 0.0001, 0.001, 0.012, 0.001, 0.004, 0.032, 0.032, 0.001, 0.003, 0.032, 0.068, 0.063, 0.017, 0.386, 0.478, 0.308, 0.149, 0.134, 0.146, 0.127, 0.121, 0.136, 0.231, 0.018, 0.009, 0.007, 0.006, 0.007, 0.0001, 0.0001, 0.045, 0.029, 0.041, 0.028, 0.022, 0.017, 0.02, 0.019, 0.025, 0.01, 0.013, 0.02, 0.033, 0.021, 0.018, 0.028, 0.002, 0.022, 0.045, 0.031, 0.01, 0.013, 0.012, 0.007, 0.005, 0.003, 0.004, 0.0001, 0.004, 0.0001, 0.009, 0.0001, 0.159, 0.026, 0.051, 0.047, 0.17, 0.025, 0.032, 0.057, 0.124, 0.003, 0.021, 0.089, 0.049, 0.12, 0.129, 0.028, 0.002, 0.124, 0.083, 0.1, 0.058, 0.016, 0.016, 0.008, 0.03, 0.012, 0.006, 0.004, 0.006, 0.001, 0.0001, 2.707, 1.09, 1.398, 0.705, 1.23, 1.04, 0.715, 0.952, 1.455, 1.297, 0.845, 1.19, 2.403, 1.193, 0.813, 1.077, 0.889, 0.565, 0.387, 0.47, 0.931, 0.663, 1.035, 0.837, 0.77, 0.772, 1.434, 1.023, 1.668, 0.609, 0.437, 0.793, 0.535, 0.706, 0.48, 0.538, 0.785, 0.909, 0.7, 0.697, 1.017, 0.519, 0.441, 0.567, 0.626, 1.082, 0.814, 1.054, 1.074, 0.811, 0.556, 0.684, 0.903, 0.43, 0.642, 0.78, 2.083, 1.147, 2.006, 1.331, 2.547, 1.015, 0.911, 0.807, 0.0001, 0.0001, 0.069, 0.007, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.003, 0.001, 0.005, 0.002, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.002, 0.001, 0.126, 1.369, 3.539, 8.968, 5.44, 4.358, 3.141, 2.48, 0.0001, 0.001, 0.001, 0.0001, 0.0001, 1.821, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
};

export default Magic;
