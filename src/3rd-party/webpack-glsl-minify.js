"use strict";
// src/index.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * List of GLSL reserved keywords to avoid mangling. We automatically include any gl_ variables.
 */
let glslReservedKeywords = [
    'layout', 'location',
    // Basic types
    'bool', 'double', 'float', 'int', 'uint',
    // Vector types
    'vec2', 'vec3', 'vec4',
    'bvec2', 'bvec3', 'bvec4',
    'dvec2', 'dvec3', 'dvec4',
    'ivec2', 'ivec3', 'ivec4',
    'uvec2', 'uvec3', 'uvec4',
    // Matrix types
    'mat2', 'mat2x2', 'mat2x3', 'mat2x4',
    'mat3', 'mat3x2', 'mat3x3', 'mat3x4',
    'mat4', 'mat4x2', 'mat4x3', 'mat4x4',
    // Sampler types
    'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube', 'sampler2DRect',
    'isampler1D', 'isampler2D', 'isampler3D', 'isamplerCube', 'isampler2DRect',
    'usampler1D', 'usampler2D', 'usampler3D', 'usamplerCube', 'usampler2DRect',
    'sampler1DArray', 'sampler2DArray', 'samplerCubeArray',
    'isampler1DArray', 'isampler2DArray', 'isamplerCubeArray',
    'usampler1DArray', 'usampler2DArray', 'usamplerCubeArray',
    'samplerBuffer', 'sampler2DMS', 'sampler2DMSArray',
    'isamplerBuffer', 'isampler2DMS', 'isampler2DMSArray',
    'usamplerBuffer', 'usampler2DMS', 'usampler2DMSArray',
    'sampler1DShadow', 'sampler2DShadow', 'samplerCubeShadow', 'sampler2DRectShadow', 'sampler1DArrayShadow',
    'sampler2DArrayShadow', 'samplerCubeArrayShadow',
    // Other type-related keywords
    'attribute', 'const', 'false', 'invariant', 'struct', 'true', 'uniform', 'varying', 'void',
    // Precision keywords
    'highp', 'lowp', 'mediump', 'precision',
    // Input/output keywords
    'in', 'inout', 'out',
    // Control keywords
    'break', 'continue', 'do', 'else', 'for', 'if', 'main', 'return', 'while',
    // Built-in macros
    '__FILE__', '__LINE__', '__VERSION__', 'GL_ES', 'GL_FRAGMENT_PRECISION_HIGH',
    // Trig functions
    'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cos', 'cosh', 'degrees', 'radians', 'sin', 'sinh', 'tan', 'tanh',
    // Exponents and logarithms
    'exp', 'exp2', 'inversesqrt', 'log', 'log2', 'pow', 'sqrt',
    // Clamping and modulus-related funcions
    'abs', 'ceil', 'clamp', 'floor', 'fract', 'max', 'min', 'mod', 'modf', 'round', 'roundEven', 'sign', 'trunc',
    // Floating point functions
    'isinf', 'isnan',
    // Boolean functions
    'all', 'any', 'equal', 'greaterThan', 'greaterThanEqual', 'lessThan', 'lessThanEqual', 'not', 'notEqual',
    // Vector functions
    'cross', 'distance', 'dot', 'faceforward', 'length', 'outerProduct', 'normalize', 'reflect', 'refract',
    // Matrix functions
    'determinant', 'inverse', 'matrixCompMult',
    // Interpolation functions
    'mix', 'step', 'smoothstep',
    // Texture functions
    'texture2D', 'texture2DProj', 'textureCube', 'textureSize', 'texture',
    // Noise functions
    'noise1', 'noise2', 'noise3', 'noise4',
    // Derivative functions
    'dFdx', 'dFdxCoarse', 'dFdxFine',
    'dFdy', 'dFdyCoarse', 'dFdyFine',
    'fwidth', 'fwidthCoarse', 'fwidthFine'
];
/**
 * Helper class to minify tokens and track reserved ones
 */
class TokenMap {
    constructor() {
        /**
         * The underlying token map itself. Although the data type is GlslUniform, it is used for all tokens, not just
         * uniforms. The type property of GlslUniform is only set for uniforms, however.
         */
        this.tokens = {};
        /**
         * Number of tokens minified. Used to generate unique names. Although we could be more sophisticated, and count
         * usage, we simply assign names in order. Few shaders have more than 52 variables (the number of single-letter
         * variable names), so simple is good enough.
         */
        this.minifiedTokenCount = 0;
        // GLSL has many reserved keywords. In order to not minify them, we add them to the token map now.
        this.reserveKeywords(glslReservedKeywords);
    }
    /**
     * Adds keywords to the reserved list to prevent minifying them.
     * @param keywords
     */
    reserveKeywords(keywords) {
        for (let n = 0; n < keywords.length; n++) {
            let keyword = keywords[n];
            this.tokens[keyword] = { variableType: undefined, variableName: keyword };
        }
    }
    /**
     * Converts a token number to a name
     */
    static getMinifiedName(tokenCount) {
        let num = tokenCount % 52;
        let offset = (num < 26) ? (num + 65) : (num + 71); // 65 = 'A'; 71 = ('a' - 26)
        let c = String.fromCharCode(offset);
        // For tokens over 52, recursively add characters
        let recurse = Math.floor(tokenCount / 52);
        return (recurse === 0) ? c : (this.getMinifiedName(recurse - 1) + c);
    }
    /**
     * Minifies a token
     * @param name Token name
     * @param uniformType If the token is a uniform, the data type
     * @returns Minified token name
     */
    minifyToken(name, uniformType) {
        // Check whether the token already has an existing minified value
        let existing = this.tokens[name];
        if (existing) {
            // In the case of a uniform with mangling explicitly disabled, we may already have an entry from the @nomangle
            // directive. But still store the type.
            if (uniformType) {
                existing.variableType = uniformType;
            }
            return existing.variableName;
        }
        // Mangle the name. Special-case any tokens starting with "gl_". They should never be minified. Likewise, never
        // mangle substitution values, which start and end with "$".
        let min = name;
        if (!name.startsWith('gl_') && name.indexOf('$') === -1) {
            min = TokenMap.getMinifiedName(this.minifiedTokenCount++);
        }
        // Allocate a new value
        this.tokens[name] = {
            variableName: min,
            variableType: uniformType
        };
        return min;
    }
    /**
     * Returns the uniforms and their associated data types
     */
    getUniforms() {
        // Filter only the tokens that have the type field set
        let result = {};
        for (let original in this.tokens) {
            let token = this.tokens[original];
            if (token.variableType) {
                result[original] = token;
            }
        }
        return result;
    }
}
exports.TokenMap = TokenMap;
var TokenType;
(function (TokenType) {
    /**
     * Normal token. May be a variable, function, or reserved keyword. (Note: attribute, uniform, and varying are
     * handled specially below)
     */
    TokenType[TokenType["ttToken"] = 0] = "ttToken";
    /** The attribute keyword */
    TokenType[TokenType["ttAttribute"] = 1] = "ttAttribute";
    /** The uniform keyword */
    TokenType[TokenType["ttUniform"] = 2] = "ttUniform";
    /** The varying keyword */
    TokenType[TokenType["ttVarying"] = 3] = "ttVarying";
    /** An operator, including brackets and parentheses. (Note: dot is a special one below) */
    TokenType[TokenType["ttOperator"] = 4] = "ttOperator";
    /** The dot operator. This operator has special meaning in GLSL due to vector swizzle masks. */
    TokenType[TokenType["ttDot"] = 5] = "ttDot";
    /** A numeric value */
    TokenType[TokenType["ttNumeric"] = 6] = "ttNumeric";
    /** A GLGL preprocessor directive */
    TokenType[TokenType["ttPreprocessor"] = 7] = "ttPreprocessor";
    /** Special value used in the parser when there is no token */
    TokenType[TokenType["ttNone"] = 8] = "ttNone";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
class GlslMinify {
    constructor(loader) {
        /** List of tokens minified by the parser */
        this.tokens = new TokenMap();
        this.constValues = {};
        /**
         * Substitution values are of the form "$0$"
         */
        this.substitutionValueCount = 0;
        this.loader = loader;
    }
    execute(content) {
        return __awaiter(this, void 0, void 0, function* () {
            let input = { contents: content };
            // Perform the minification. This takes three separate passes over the input.
            let pass1 = yield this.preprocessPass1(input);
            let pass2 = this.preprocessPass2(pass1);
            let pass3 = this.minifier(pass2);
            return {
                sourceCode: pass3,
                uniforms: this.tokens.getUniforms(),
                consts: this.constValues
            };
        });
    }
    readFile(filename, directory) {
        return new Promise((resolve, reject) => {
            // If no directory was provided, use the root GLSL file being included
            if (!directory && this.loader) {
                directory = this.loader.context;
            }
            let readInternal = (path) => {
                fs_1.readFile(path, 'utf-8', (err, data) => {
                    if (!err) {
                        // Success
                        resolve({ path: path, contents: data });
                    }
                    else {
                        reject(err);
                    }
                });
            };
            if (this.loader) {
                // Resolve the file path
                this.loader.resolve(directory, filename, (err, path) => {
                    if (err) {
                        return reject(err);
                    }
                    this.loader.addDependency(path);
                    readInternal(path);
                });
            }
            else {
                // Special case for unit tests without a Webpack LoaderContext. Just read the file.
                readInternal(filename);
            }
        });
    }
    /**
     * The first pass of the preprocessor removes comments and handles include directives
     */
    preprocessPass1(content) {
        return __awaiter(this, void 0, void 0, function* () {
            let output = content.contents;
            // Remove carriage returns. Use newlines only.
            output = output.replace('\r', '');
            // Remove C style comments
            let cStyleRegex = /\/\*[\s\S]*?\*\//g;
            output = output.replace(cStyleRegex, '');
            // Remove C++ style comments
            let cppStyleRegex = /\/\/[^\n]*/g;
            output = output.replace(cppStyleRegex, '\n');
            // Process @include directive
            let includeRegex = /@include\s+(.*)/;
            while (true) {
                // Find the next @include directive
                let match = includeRegex.exec(output);
                if (!match) {
                    break;
                }
                let includeFilename = JSON.parse(match[1]);
                // Read the file to include
                let currentPath = content.path ? path_1.dirname(content.path) : undefined;
                let includeFile = yield this.readFile(includeFilename, currentPath);
                // Parse recursively, as the included file may also have @include directives
                let includeContent = yield this.preprocessPass1(includeFile);
                // Replace the @include directive with the file contents
                output = output.replace(includeRegex, includeContent);
            }
            return output;
        });
    }
    assignSubstitionValue(constName, constType) {
        let substitutionValue = '$' + (this.substitutionValueCount++) + '$';
        this.tokens.reserveKeywords([substitutionValue]);
        this.constValues[constName] = {
            variableName: substitutionValue,
            variableType: constType
        };
        return substitutionValue;
    }
    /**
     * The second pass of the preprocessor handles nomange and define directives
     */
    preprocessPass2(content) {
        let output = content;
        // Process @nomangle directives
        let nomangleRegex = /@nomangle\s+(.*)/;
        while (true) {
            // Find the next @nomangle directive
            let match = nomangleRegex.exec(output);
            if (!match) {
                break;
            }
            // Record the keywords
            let keywords = match[1].split(/\s/);
            this.tokens.reserveKeywords(keywords);
            // Remove the @nomangle line
            output = output.replace(nomangleRegex, '');
        }
        // Process @define directives
        let defineRegex = /@define\s+(\S+)\s+(.*)/;
        while (true) {
            // Find the next @define directive
            let match = defineRegex.exec(output);
            if (!match) {
                break;
            }
            let defineMacro = match[1];
            let replaceValue = match[2];
            // Remove the @define line
            output = output.replace(defineRegex, '');
            // Replace all instances of the macro with its value
            //
            // BUGBUG: We start at the beginning of the file, which means we could do replacements prior to the @define
            //   directive. This is unlikely to happen in real code but will cause some weird behaviors if it does.
            let offset = output.indexOf(defineMacro);
            while (offset >= 0 && offset < output.length) {
                // Ensure that the macro isn't appearing within a larger token
                let nextOffset = offset + defineMacro.length;
                let nextChar = output[nextOffset];
                if (/\w/.test(nextChar)) {
                    // Ignore. Part of a larger token. Begin searching again at the next non-word.
                    do {
                        nextChar = output[++nextOffset];
                    } while (nextChar && /\w/.test(nextChar));
                    offset = nextOffset;
                }
                else {
                    // Replace
                    let begin = output.substring(0, offset);
                    let end = output.substring(nextOffset);
                    output = begin + replaceValue + end;
                    offset += replaceValue.length;
                }
                // Advance the offset
                offset = output.indexOf(defineMacro, offset);
            }
        }
        // Process @const directives
        let constRegex = /@const\s+(.*)/;
        while (true) {
            // Find the next @const directive
            let match = constRegex.exec(output);
            if (!match) {
                break;
            }
            // Parse the tokens
            let parts = match[1].split(/\s/);
            if (parts.length !== 2) {
                throw new Error('@const directives require two parameters');
            }
            let constType = parts[0];
            let constName = parts[1];
            // Assign a substitution value
            let substitutionValue = this.assignSubstitionValue(constName, constType);
            // Replace the directive with a constant declaration
            let newCode = 'const ' + constType + ' ' + constName + '=' + substitutionValue + ';';
            output = output.replace(constRegex, newCode);
        }
        return output;
    }
    /** Determines the token type of a token string */
    static getTokenType(token) {
        if (token === 'attribute') {
            return TokenType.ttAttribute;
        }
        else if (token === 'uniform') {
            return TokenType.ttUniform;
        }
        else if (token === 'varying' || token === 'in' || token === 'out') {
            return TokenType.ttVarying;
        }
        else if (token === '.') {
            return TokenType.ttDot;
        }
        else if (token[0] === '#') {
            return TokenType.ttPreprocessor;
        }
        else if (/[0-9]/.test(token[0])) {
            return TokenType.ttNumeric;
        }
        else if (/\w/.test(token[0])) {
            return TokenType.ttToken;
        }
        else {
            return TokenType.ttOperator;
        }
    }
    /**
     * The final pass consists of the actual minifier itself
     */
    minifier(content) {
        // Unlike the previous passes, on this one, we start with an empty output and build it up
        let output = '';
        // The token regex looks for any of four items:
        //  1) An alphanumeric token (\w+), which may include underscores (or $ for substitution values)
        //  2) One or more operators (non-alphanumeric, non-dot)
        //  3) A dot operator
        //  4) GLSL preprocessor directive beginning with #
        let tokenRegex = /[\w$]+|[^\s\w#.]+|\.|#.*/g;
        // Minifying requires a simple state machine the lookbacks to the previous two tokens
        let match;
        let prevToken;
        let prevType = TokenType.ttNone;
        let prevPrevType = TokenType.ttNone;
        while (match = tokenRegex.exec(content)) {
            let token = match[0];
            let type = GlslMinify.getTokenType(token);
            switch (type) {
                case TokenType.ttPreprocessor:
                    // Preprocessor directives must always begin on a new line
                    if (output !== '' && !output.endsWith('\n')) {
                        output += '\n';
                    }
                    // Special case for #define: we want to minify the value being defined
                    let defineRegex = /#define\s(\w+)\s(.*)/;
                    let subMatch = defineRegex.exec(token);
                    if (subMatch) {
                        let minToken = this.tokens.minifyToken(subMatch[1]);
                        output += '#define ' + minToken + ' ' + subMatch[2] + '\n';
                        break;
                    }
                    // Preprocessor directives are special in that they require the newline
                    output += token + '\n';
                    break;
                case TokenType.ttNumeric:
                    // Special case for numerics: we can omit a zero following a dot (e.g. "1." is the same as "1.0") in GLSL
                    if (token === '0' && prevType === TokenType.ttDot) {
                        break;
                    }
                // Fall through to below
                case TokenType.ttOperator:
                case TokenType.ttDot:
                    output += token;
                    break;
                case TokenType.ttToken:
                case TokenType.ttAttribute:
                case TokenType.ttUniform:
                case TokenType.ttVarying:
                    // Special case: a token following a dot is a swizzle mask. Leave it as-is.
                    if (prevType === TokenType.ttDot) {
                        output += token;
                        break;
                    }
                    // For attribute and varying declarations, turn off minification.
                    if (prevPrevType === TokenType.ttAttribute || prevPrevType === TokenType.ttVarying|| prevPrevType === TokenType.ttUniform) {
                        this.tokens.reserveKeywords([token]);
                    }
                    // Try to minify the token
                    let minToken;
                    if (prevPrevType === TokenType.ttUniform) {
                        // This is a special case of a uniform declaration
                        minToken = this.tokens.minifyToken(token, prevToken);
                    }
                    else {
                        // Normal token
                        minToken = this.tokens.minifyToken(token);
                    }
                    // When outputting, if the previous token was not an operator or newline, leave a space.
                    if (prevType !== TokenType.ttOperator && prevType !== TokenType.ttPreprocessor &&
                        prevType !== TokenType.ttNone) {
                        output += ' ';
                    }
                    output += minToken;
                    break;
            }
            // Advance to the next token
            prevPrevType = prevType;
            prevType = type;
            prevToken = token;
        }
        return output;
    }
    /** Similar to JSON.stringify(), except without double-quotes around property names */
    static stringify(obj) {
        if (Array.isArray(obj)) {
            let output = '[';
            let isFirst = true;
            for (let n = 0; n < obj.length; n++) {
                let value = obj[n];
                if (!isFirst) {
                    output += ',';
                }
                output += this.stringify(value);
                isFirst = false;
            }
            output += ']';
            return output;
        }
        else if (typeof (obj) === 'object') {
            let output = '{';
            let isFirst = true;
            for (let prop in obj) {
                let value = obj[prop];
                if (!isFirst) {
                    output += ',';
                }
                output += prop + ':' + this.stringify(value);
                isFirst = false;
            }
            output += '}';
            return output;
        }
        else {
            return JSON.stringify(obj);
        }
    }
}
exports.GlslMinify = GlslMinify;
function default_1(content) {
    return __awaiter(this, void 0, void 0, function* () {
        let loader = this;
        let callback = loader.async();
        try {
            let glsl = new GlslMinify(loader);
            let program = yield glsl.execute(content);
            let code = 'module.exports = ' + GlslMinify.stringify(program);
            callback(null, code);
        }
        catch (err) {
            callback(err);
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map
