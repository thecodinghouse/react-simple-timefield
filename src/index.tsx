import React, { ChangeEvent, CSSProperties, ReactElement } from "react";

const DEFAULT_COLON = ":";
const DEFAULT_COLON_FULL = ".";
const DEFAULT_VALUE_SHORT = `00${DEFAULT_COLON}00`;
const DEFAULT_VALUE_SECOND = `00${DEFAULT_COLON}00${DEFAULT_COLON}00`;
const DEFAULT_VALUE_FULL = `00${DEFAULT_COLON}00${DEFAULT_COLON}00${DEFAULT_COLON_FULL}000`;

export function isNumber<T>(value: T): boolean {
  const number = Number(value);
  return !isNaN(number) && String(value) === String(number);
}

export function formatTimeItem(value?: string | number): string {
  return `${value || ""}00`.substr(0, 2);
}

export function formatTimeFullItem(value?: string | number): string {
  return `${value || ""}000`.substr(0, 3);
}

export function validateTimeAndCursor(
  showSeconds = false,
  showFull = false,
  value = "",
  defaultValue = "",
  colon = DEFAULT_COLON,
  cursorPosition = 0
): [string, number] {
  let newCursorPosition = Number(cursorPosition);

  let [oldH, oldM, oldTempS] = defaultValue.split(colon);
  let [oldS, oldF] = oldTempS.split(DEFAULT_COLON_FULL);

  let [newH, newM, newTempS] = String(value).split(colon);
  let [newS, newF] = newTempS.split(DEFAULT_COLON_FULL);

  //console.log(oldH, oldM, oldS, oldF, oldTempS);
  //console.log(newH, newM, newS, newF, newTempS);

  newH = formatTimeItem(newH);
  if (Number(newH[0]) > 2) {
    newH = oldH;
    newCursorPosition -= 1;
  } else if (Number(newH[0]) === 2) {
    if (Number(oldH[0]) === 2 && Number(newH[1]) > 3) {
      newH = `2${oldH[1]}`;
      newCursorPosition -= 2;
    } else if (Number(newH[1]) > 3) {
      newH = "23";
    }
  }

  newM = formatTimeItem(newM);
  if (Number(newM[0]) > 5) {
    newM = oldM;
    newCursorPosition -= 1;
  }

  if (showFull || showSeconds) {
    newS = formatTimeItem(newS);
    if (Number(newS[0]) > 5) {
      newS = oldS;
      newCursorPosition -= 1;
    }
  }

  if (showFull) newF = formatTimeFullItem(newF);

  const validatedValue = showFull
    ? `${newH}${colon}${newM}${colon}${newS}${DEFAULT_COLON_FULL}${newF}`
    : showSeconds
    ? `${newH}${colon}${newM}${colon}${newS}`
    : `${newH}${colon}${newM}`;

  return [validatedValue, newCursorPosition];
}

type onChangeType = (
  event: ChangeEvent<HTMLInputElement>,
  value: string
) => void;

interface Props {
  value?: string;
  onChange?: onChangeType;
  showSeconds?: boolean;
  showFull?: boolean;
  input: ReactElement | null;
  inputRef?: () => HTMLInputElement | null;
  colon?: string;
  style?: CSSProperties | {};
}

interface State {
  value: string;
  _colon: string;
  _defaultValue: string;
  _showSeconds: boolean;
  _showFull: boolean;
  _maxLength: number;
}

export default class TimeField extends React.Component<Props, State> {
  static defaultProps: Props = {
    showSeconds: false,
    showFull: false,
    input: null,
    style: {},
    colon: DEFAULT_COLON
  };

  constructor(props: Props) {
    super(props);

    const _showSeconds = Boolean(props.showSeconds);
    const _showFull = Boolean(props.showFull);
    const _defaultValue = _showFull
      ? DEFAULT_VALUE_FULL
      : _showSeconds
      ? DEFAULT_VALUE_SECOND
      : DEFAULT_VALUE_SHORT;
    const _colon =
      props.colon && props.colon.length === 1 ? props.colon : DEFAULT_COLON;
    const [validatedTime] = validateTimeAndCursor(
      _showSeconds,
      _showFull,
      this.props.value,
      _defaultValue,
      _colon
    );

    this.state = {
      value: validatedTime,
      _colon,
      _showSeconds,
      _showFull,
      _defaultValue,
      _maxLength: _defaultValue.length
    };

    this.onInputChange = this.onInputChange.bind(this);
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.props.value !== prevProps.value) {
      const [validatedTime] = validateTimeAndCursor(
        this.state._showSeconds,
        this.state._showFull,
        this.props.value,
        this.state._defaultValue,
        this.state._colon
      );
      this.setState({
        value: validatedTime
      });
    }
  }

  onInputChange(
    event: ChangeEvent<HTMLInputElement>,
    callback: onChangeType
  ): void {
    const oldValue = this.state.value;
    const inputEl = event.target;
    const inputValue = inputEl.value;
    const position = inputEl.selectionEnd || 0;
    const isTyped = inputValue.length > oldValue.length;
    const cursorCharacter = inputValue[position - 1];
    const addedCharacter = isTyped ? cursorCharacter : null;
    const removedCharacter = isTyped ? null : oldValue[position];
    const replacedSingleCharacter =
      inputValue.length === oldValue.length ? oldValue[position - 1] : null;
    const colon = this.state._colon;

    let newValue = oldValue;
    let newPosition = position;

    console.log(
      newValue,
      newPosition,
      addedCharacter,
      position,
      this.state._maxLength,
      replacedSingleCharacter
    );

    if (addedCharacter !== null) {
      if (position > this.state._maxLength) {
        newPosition = this.state._maxLength;
      } else if (
        (position === 3 || position === 6) &&
        addedCharacter === colon
      ) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}${colon}${inputValue.substr(position + 1)}`;
      } else if (position === 9 && addedCharacter === DEFAULT_COLON_FULL) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}${DEFAULT_COLON_FULL}${inputValue.substr(position + 1)}`;
      } else if (
        (position === 3 || position === 6) &&
        isNumber(addedCharacter)
      ) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}${colon}${addedCharacter}${inputValue.substr(position + 2)}`;
        newPosition = position + 1;
      } else if (position === 9 && isNumber(addedCharacter)) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}${DEFAULT_COLON_FULL}${addedCharacter}${inputValue.substr(
          position + 2
        )}`;
        newPosition = position + 1;
      } else if (isNumber(addedCharacter)) {
        // user typed a number
        newValue =
          inputValue.substr(0, position - 1) +
          addedCharacter +
          inputValue.substr(position + 1);
        if (position === 2 || position === 5 || position === 8) {
          newPosition = position + 1;
        }
      } else {
        // if user typed NOT a number, then keep old value & position
        newPosition = position - 1;
      }
    } else if (replacedSingleCharacter !== null) {
      // user replaced only a single character
      if (isNumber(cursorCharacter)) {
        if (position - 1 === 2 || position - 1 === 5) {
          newValue = `${inputValue.substr(
            0,
            position - 1
          )}${colon}${inputValue.substr(position)}`;
        } else if (position - 1 === 8) {
          newValue = `${inputValue.substr(
            0,
            position - 1
          )}${DEFAULT_COLON_FULL}${inputValue.substr(position)}`;
        } else {
          newValue = inputValue;
        }
      } else {
        // user replaced a number on some non-number character
        newValue = oldValue;
        newPosition = position - 1;
      }
    } else if (
      typeof cursorCharacter !== "undefined" &&
      cursorCharacter !== colon &&
      !isNumber(cursorCharacter)
    ) {
      // set of characters replaced by non-number
      newValue = oldValue;
      newPosition = position - 1;
    } else if (removedCharacter !== null) {
      if ((position === 2 || position === 5) && removedCharacter === colon) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}0${colon}${inputValue.substr(position)}`;
        newPosition = position - 1;
      } else if (position === 8 && removedCharacter === DEFAULT_COLON_FULL) {
        newValue = `${inputValue.substr(
          0,
          position - 1
        )}0${DEFAULT_COLON_FULL}${inputValue.substr(position)}`;
        newPosition = position - 1;
      } else {
        // user removed a number
        newValue = `${inputValue.substr(0, position)}0${inputValue.substr(
          position
        )}`;
      }
    }

    const [validatedTime, validatedCursorPosition] = validateTimeAndCursor(
      this.state._showSeconds,
      this.state._showFull,
      newValue,
      oldValue,
      colon,
      newPosition
    );

    this.setState({ value: validatedTime }, () => {
      inputEl.selectionStart = validatedCursorPosition;
      inputEl.selectionEnd = validatedCursorPosition;
      callback(event, validatedTime);
    });

    event.persist();
  }

  render(): ReactElement {
    const { value } = this.state;
    const {
      onChange,
      style,
      showSeconds,
      showFull,
      input,
      inputRef,
      colon,
      ...props
    } = this.props; //eslint-disable-line no-unused-vars
    const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) =>
      this.onInputChange(
        event,
        (e: ChangeEvent<HTMLInputElement>, v: string) =>
          onChange && onChange(e, v)
      );

    if (input) {
      return React.cloneElement(input, {
        ...props,
        value,
        style,
        onChange: onChangeHandler
      });
    }

    return (
      <input
        type="text"
        {...props}
        ref={inputRef}
        value={value}
        onChange={onChangeHandler}
        style={{ width: showFull ? 250 : showSeconds ? 54 : 35, ...style }}
      />
    );
  }
}
