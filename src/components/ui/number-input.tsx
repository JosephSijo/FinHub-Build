import * as React from "react";
import { Input } from "./input";
import { formatNumberWithCommas, removeCommas, isValidNumber } from "../../utils/numberFormat";

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  maxDecimals?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimals = true, maxDecimals = 2, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value === '' || value === undefined || value === null) {
        setDisplayValue('');
      } else {
        const stringValue = value.toString();
        setDisplayValue(formatNumberWithCommas(stringValue));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove all commas
      const cleanValue = removeCommas(inputValue);
      
      // Validate the input
      if (!isValidNumber(cleanValue)) {
        return; // Don't update if invalid
      }

      // Handle decimals
      if (!allowDecimals && cleanValue.includes('.')) {
        return; // Don't allow decimals if not permitted
      }

      // Limit decimal places
      if (allowDecimals && cleanValue.includes('.')) {
        const parts = cleanValue.split('.');
        if (parts[1] && parts[1].length > maxDecimals) {
          return; // Don't allow more decimal places than specified
        }
      }

      // Update display with formatted value
      setDisplayValue(formatNumberWithCommas(cleanValue));
      
      // Send raw value (without commas) to parent
      onChange(cleanValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Re-format on blur to ensure consistency
      const cleanValue = removeCommas(displayValue);
      if (cleanValue) {
        setDisplayValue(formatNumberWithCommas(cleanValue));
      }
      
      // Call original onBlur if provided
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
