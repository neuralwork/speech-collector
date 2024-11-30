import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";


// Define type for formConfig items
interface FormField {
    id: string;
    label: string;
    type: string;
    required?: boolean;
    defaultValue?: string | null;
}

// Define the shape of form data
type FormValues = {
    [key: string]: string | undefined;
};

const useDynamicForm = (formConfig: FormField[], userMetadata: Record<string, any> | null ) => {
    const localFormConfig: FormField[] = formConfig as FormField[];

    // Define validation schema using Yup
    const validationSchema = Yup.object().shape(
        localFormConfig.reduce((schema, field) => {
            if (field.required) {
                schema[field.label] = Yup.string().required(`${field.label} is required`);
            }
            switch (field.type) {
                case "email":
                    schema[field.label] = Yup.string().email("Invalid email format");
                    break;
                case "date":
                    schema[field.label] = Yup.date().typeError("Invalid date format");
                    break;
                case "integer":
                    schema[field.label] = Yup.number()
                        .integer("Must be an integer")
                        .typeError("Invalid integer format");
                    break;
                case "float":
                    schema[field.label] = Yup.number()
                        .typeError("Invalid number format")
                        .test(
                            "is-decimal",
                            "Must be a decimal number",
                            (value) => value === undefined || value === null || Number(value) % 1 !== 0
                        );
                    break;
                case "url":
                    schema[field.label] = Yup.string().url("Invalid URL format");
                    break;
                default:
                    break;
            }
            return schema;
        }, {} as Record<string, Yup.AnySchema>)
    );

    // Set up React Hook Form with Yup validation
    return useForm<FormValues>({
        resolver: yupResolver(validationSchema),
        defaultValues: localFormConfig.reduce((acc, field) => {
            acc[field.id] = userMetadata?.[field.id] || field.defaultValue || "";
            return acc;
        }, {} as FormValues),
    });
}

export default useDynamicForm;