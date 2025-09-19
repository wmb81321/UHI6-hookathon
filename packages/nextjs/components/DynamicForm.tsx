"use client";

import { useState } from "react";
import { FormField, FormSchema, groupFieldsByCategory } from "~~/utils/csvParser";

interface DynamicFormProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DynamicForm = ({ schema, onSubmit, onCancel, isLoading = false }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groupedFields = groupFieldsByCategory(schema.fields);

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    schema.fields.forEach(field => {
      if (field.required && (!formData[field.field_key] || formData[field.field_key] === "")) {
        newErrors[field.field_key] = `${field.label} is required`;
      }

      if (field.type === "email" && formData[field.field_key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.field_key])) {
          newErrors[field.field_key] = "Invalid email format";
        }
      }

      if (field.type === "phone" && formData[field.field_key]) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(formData[field.field_key])) {
          newErrors[field.field_key] = "Invalid phone format (use E.164 format)";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const { field_key, label, type, required, description, example, options, upload } = field;

    if (upload) {
      return (
        <div key={field_key} className="form-control">
          <label className="label">
            <span className="label-text">
              {label} {required && <span className="text-error">*</span>}
            </span>
          </label>
          <input
            type="file"
            className="file-input file-input-bordered w-full"
            onChange={e => handleInputChange(field_key, e.target.files?.[0])}
            required={required}
          />
          {description && (
            <label className="label">
              <span className="label-text-alt">{description}</span>
            </label>
          )}
          {errors[field_key] && (
            <label className="label">
              <span className="label-text-alt text-error">{errors[field_key]}</span>
            </label>
          )}
        </div>
      );
    }

    switch (type) {
      case "enum":
        return (
          <div key={field_key} className="form-control">
            <label className="label">
              <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={formData[field_key] || ""}
              onChange={e => handleInputChange(field_key, e.target.value)}
              required={required}
            >
              <option value="">Select {label}</option>
              {options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {description && (
              <label className="label">
                <span className="label-text-alt">{description}</span>
              </label>
            )}
            {errors[field_key] && (
              <label className="label">
                <span className="label-text-alt text-error">{errors[field_key]}</span>
              </label>
            )}
          </div>
        );

      case "array":
        return (
          <div key={field_key} className="form-control">
            <label className="label">
              <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {options?.map(option => (
                <label key={option} className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mr-2"
                    checked={(formData[field_key] || []).includes(option)}
                    onChange={e => {
                      const currentArray = formData[field_key] || [];
                      if (e.target.checked) {
                        handleInputChange(field_key, [...currentArray, option]);
                      } else {
                        handleInputChange(
                          field_key,
                          currentArray.filter((item: string) => item !== option),
                        );
                      }
                    }}
                  />
                  <span className="label-text">{option}</span>
                </label>
              ))}
            </div>
            {description && (
              <label className="label">
                <span className="label-text-alt">{description}</span>
              </label>
            )}
            {errors[field_key] && (
              <label className="label">
                <span className="label-text-alt text-error">{errors[field_key]}</span>
              </label>
            )}
          </div>
        );

      case "date":
        return (
          <div key={field_key} className="form-control">
            <label className="label">
              <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
              </span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData[field_key] || ""}
              onChange={e => handleInputChange(field_key, e.target.value)}
              required={required}
              placeholder={example}
            />
            {description && (
              <label className="label">
                <span className="label-text-alt">{description}</span>
              </label>
            )}
            {errors[field_key] && (
              <label className="label">
                <span className="label-text-alt text-error">{errors[field_key]}</span>
              </label>
            )}
          </div>
        );

      case "number":
      case "integer":
        return (
          <div key={field_key} className="form-control">
            <label className="label">
              <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
              </span>
            </label>
            <input
              type="number"
              step={type === "integer" ? "1" : "0.01"}
              className="input input-bordered w-full"
              value={formData[field_key] || ""}
              onChange={e =>
                handleInputChange(field_key, type === "integer" ? parseInt(e.target.value) : parseFloat(e.target.value))
              }
              required={required}
              placeholder={example}
            />
            {description && (
              <label className="label">
                <span className="label-text-alt">{description}</span>
              </label>
            )}
            {errors[field_key] && (
              <label className="label">
                <span className="label-text-alt text-error">{errors[field_key]}</span>
              </label>
            )}
          </div>
        );

      default:
        return (
          <div key={field_key} className="form-control">
            <label className="label">
              <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
              </span>
            </label>
            <input
              type={type === "email" ? "email" : type === "phone" ? "tel" : "text"}
              className="input input-bordered w-full"
              value={formData[field_key] || ""}
              onChange={e => handleInputChange(field_key, e.target.value)}
              required={required}
              placeholder={example}
            />
            {description && (
              <label className="label">
                <span className="label-text-alt">{description}</span>
              </label>
            )}
            {errors[field_key] && (
              <label className="label">
                <span className="label-text-alt text-error">{errors[field_key]}</span>
              </label>
            )}
          </div>
        );
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">{schema.actor.replace(/_/g, " ")} Verification Form</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(groupedFields).map(([category, fields]) => (
            <div key={category} className="collapse collapse-open border border-base-300 rounded-box">
              <div className="collapse-title text-lg font-medium bg-base-200">{category.replace(/:/g, " - ")}</div>
              <div className="collapse-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">{fields.map(renderField)}</div>
              </div>
            </div>
          ))}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className={`btn btn-primary ${isLoading ? "loading" : ""}`} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
