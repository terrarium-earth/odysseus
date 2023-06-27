import {Json, JsonObject} from "./Json";

export default (text: string) => {
    let currentPosition = 0;
    let currentCharacter = text.charAt(currentPosition);

    const escapes = {
        '"': '"',
        '\'': '\'',
        '\\': '\\',
        '/': '/',
        b: 'b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t'
    };

    const allowKeyChar = /[a-zA-Z0-9_]/;

    const nextCharacter = (c?: string) => {
        if (c && c !== currentCharacter) {
            throw new SyntaxError(`Expected '${c}' instead of '${currentCharacter}' at ${currentPosition}`);
        }

        currentPosition += 1;
        return text.charAt(currentPosition);
    };

    const bulkNext = (c: string) => {
        let result = '';
        for (let i = 0; i < c.length; i++) {
            result += (currentCharacter = nextCharacter(c[i]));
        }
        return result;
    };

    const number = () => {
        let string = '';
        let float = false;

        if (currentCharacter === '-') {
            string = '-';
            currentCharacter = nextCharacter('-');
        }

        while (currentCharacter >= '0' && currentCharacter <= '9') {
            string += currentCharacter;
            currentCharacter = nextCharacter();
        }

        if (currentCharacter === '.') {
            string += '.';
            while ((currentCharacter = nextCharacter()) && currentCharacter >= '0' && currentCharacter <= '9') {
                string += currentCharacter;
            }
            float = true;
        }

        if (currentCharacter === 'e' || currentCharacter === 'E') {
            string += currentCharacter;
            currentCharacter = nextCharacter();

            if (currentCharacter === '-' || currentCharacter === '+') {
                string += currentCharacter;
                currentCharacter = nextCharacter();
            }

            while (currentCharacter >= '0' && currentCharacter <= '9') {
                string += currentCharacter;
                currentCharacter = nextCharacter();
            }
        }

        switch (currentCharacter.toUpperCase()) {
            case 'B':
            case 'S':
            case 'I':
            case 'L':
                currentCharacter = nextCharacter();
                return string;
            case 'F':
            case 'D':
                currentCharacter = nextCharacter();
                return parseFloat(string);
            default:
                return float ? parseFloat(string) : parseInt(string);
        }
    };

    const string = () => {
        let quote;
        let result = '';

        if (currentCharacter === '"' || currentCharacter === "'") {
            quote = currentCharacter;
            while (currentCharacter = nextCharacter()) {
                if (currentCharacter === '\\') {
                    currentCharacter = nextCharacter();
                    if (currentCharacter === 'u') {
                        let characterCode = 0;
                        for (let i = 0; i < 4; i += 1) {
                            let hex = parseInt(currentCharacter = nextCharacter(), 16);

                            if (!isFinite(hex)) {
                                throw new SyntaxError(`Bad unicode escape at ${currentPosition}`);
                            }

                            characterCode = characterCode * 16 + hex;
                        }
                        result += String.fromCharCode(characterCode);
                    } else if (currentCharacter in escapes) {
                        result += escapes[currentCharacter as keyof typeof escapes];
                    } else {
                        break;
                    }
                } else if (currentCharacter === quote) {
                    currentCharacter = nextCharacter(quote);
                    return result;
                } else {
                    result += currentCharacter;
                }
            }
        }

        throw new SyntaxError(`Bad string at ${currentPosition}`);
    };

    const readWhitespace = () => {
        while (currentCharacter && currentCharacter <= ' ') {
            currentCharacter = nextCharacter();
        }
    }

    const word = () => {
        switch (currentCharacter) {
            case 't':
                bulkNext('true');
                return true;
            case 'f':
                bulkNext('false');
                return false;
            case 'n':
                bulkNext('null');
                return null;
        }

        throw new SyntaxError(`Unexpected '${currentCharacter}' at ${currentPosition}`);
    };

    const array = () => {
        let result: Json[] = [];

        if (currentCharacter === '[') {
            currentCharacter = nextCharacter('[');
            readWhitespace();

            if (['B', 'S', 'I', 'L', 'F', 'D'].includes(currentCharacter.toUpperCase())) {
                currentCharacter = nextCharacter();
                currentCharacter = nextCharacter(';');
                readWhitespace();
            }

            if (currentCharacter === ']') {
                currentCharacter = nextCharacter(']');
                return result;
            }

            while (currentCharacter) {
                result.push(value());
                readWhitespace();

                if (currentCharacter === ']') {
                    currentCharacter = nextCharacter(']');
                    return result;
                }

                if (currentCharacter === ',') {
                    currentCharacter = nextCharacter(',');
                }

                readWhitespace();
            }
        }

        throw new SyntaxError(`Bad array at ${currentPosition}`);
    };

    const key = () => {
        let result = '';

        let quoted = false;
        if (currentCharacter === '"') {
            quoted = true;
            currentCharacter = nextCharacter('"');
        }

        if (allowKeyChar.test(currentCharacter)) {
            while (currentCharacter) {
                if (quoted) {
                    if (currentCharacter !== '"') {
                        result += currentCharacter;
                        currentCharacter = nextCharacter();
                    } else {
                        currentCharacter = nextCharacter('"');

                        return result;
                    }
                } else {
                    if (allowKeyChar.test(currentCharacter)) {
                        result += currentCharacter;
                        currentCharacter = nextCharacter();
                    } else {
                        return result;
                    }
                }
            }
        }

        throw new SyntaxError(`Bad key at ${currentPosition}`);
    };

    const object = () => {
        const result: JsonObject = {};

        currentCharacter = nextCharacter('{');
        readWhitespace();

        if (currentCharacter === '}') {
            currentCharacter = nextCharacter('}');
            return result;
        }

        while (currentCharacter) {
            const k = key();
            readWhitespace();

            currentCharacter = nextCharacter(':');
            result[k] = value();
            readWhitespace();

            if (currentCharacter === '}') {
                currentCharacter = nextCharacter('}');
                return result;
            }

            if (currentCharacter === ',') {
                currentCharacter = nextCharacter(',');
            }

            readWhitespace();
        }

        throw new SyntaxError(`EOF at ${currentPosition}`);
    }

    const value = (): Json => {
        readWhitespace();

        switch (currentCharacter) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
            case '\'':
                return string();
            case '-':
                return number();
            default:
                return currentCharacter >= '0' && currentCharacter <= '9' ? number() : word();
        }
    }

    return value();
}
