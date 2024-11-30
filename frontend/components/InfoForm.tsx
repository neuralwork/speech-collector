import { useState, useContext, useEffect } from "react";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBBtn
} from "mdb-react-ui-kit";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import "./InfoForm.css";
import AuthContext from "../contexts/AuthProvider";
import formConfig from "../../infoFormConfig.json"; // Import the config file


// Define types for the component props
interface InfoFormProps {
  message: string;
  onContinue: () => void;
}

// Define type for formConfig items
interface FormField {
  id: string
  label: string
  type: string
  required?: boolean
}
const localFormConfig: FormField[] = formConfig as FormField[];

const InfoForm = ({ message, onContinue }: InfoFormProps) => {
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { userName, userMetadata, setUserMetadata } = useContext(AuthContext);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Define the shape of form data
  type FormValues = {
    [key: string]: string | undefined | null;
  };
  // Define validation schema using Yup
  const validationSchema = Yup.object().shape(
    formConfig.reduce((schema, field) => {
      let baseSchema: Yup.AnySchema;
      // Initialize the base schema based on the field type
      switch (field.type) {
        case 'email':
          baseSchema = Yup.string().email('Invalid input');
          break;
        case 'date':
          baseSchema = Yup.date().typeError('Invalid input');
          break;
        case 'integer':
          baseSchema = Yup.number().integer('Must be integer').typeError('Invalid input');
          break;
        case 'float':
          baseSchema = Yup.number().typeError('Invalid input');
          break;
        case 'url':
          baseSchema = Yup.string().url('Must be a url').typeError('Invalid input');
          break;
        default:
          baseSchema = Yup.string().nullable().notRequired();
          break;
      }
      baseSchema = baseSchema.transform(
        (value, originalValue) => originalValue === "" ? null : value
      )

      baseSchema = field.required ? 
      baseSchema.required('This field is required') :
      baseSchema.nullable().notRequired();

      schema[field.id] = baseSchema;
      return schema;
    }, {} as Record<string, Yup.AnySchema>)
  );

  // Set up React Hook Form with Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
    setValue,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema)
  });

  // Populate form values when userMetadata changes
  useEffect(() => {
    if (userMetadata) {
      localFormConfig.forEach((field) => {
        setValue(field.id, userMetadata?.[field.id]);
      });
    }
  }, [userMetadata, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      setFormMessage(null);
      const response = await fetch(`${apiUrl}/api/update-user-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, metadata: data }),
      });
      if (response.ok) {
        setUserMetadata(data);
        setFormMessage("Saved.")
      } else {
        setFormMessage("Failed to save, try again.");
        throw new Error("Server failed.");
      }
    } catch (error) {
      console.error("Error while updating user information:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MDBContainer fluid>
        <MDBRow className="d-flex justify-content-center align-items-center h-100">
          <MDBCard
            className="bg-dark text-white my-5 mx-auto"
            style={{ borderRadius: "1rem", maxWidth: "400px" }}
          >
            <MDBCardBody className="p-5 d-flex flex-column align-items-center mx-auto w-100">
              <p>{message}</p>
              {formConfig.map((field) => (
                <div key={field.id} className="mb-4 mx-5 w-100">
                  <label htmlFor={field.id} className="form-label text-white">
                    {`${field.label}${field.required ? " (required)" : " (optional)"}`}
                  </label>
                  <MDBInput
                    id={field.id}
                    type={field.type}
                    size="lg"
                    {...register(field.id)}
                    className={`form-control ${errors[field.id] ? "is-invalid" : ""}`}
                  />
                  {/* Show error message only if the form has been submitted */}
                  {isSubmitted && errors[field.id] && (
                    <div className="custom-error">{errors[field.id]?.message}</div>
                  )}
                </div>
              ))}

              {/* Row for buttons */}
              <MDBRow className="w-100 mt-3 d-flex justify-content-between">
                <MDBCol size="6" className="d-flex justify-content-center">
                  <MDBBtn type="submit" color="light" disabled={isSubmitting}>
                    Save
                  </MDBBtn>
                </MDBCol>
                <MDBCol size="6" className="d-flex justify-content-center">
                  <MDBBtn
                    type="button"
                    color="light"
                    onClick={() => handleSubmit(onSubmit)().then(onContinue)}
                    disabled={isSubmitting}
                  >
                    Save and Continue
                  </MDBBtn>
                </MDBCol>
              </MDBRow>

              {/* General error message at the bottom */}
              {(
                <p className="mt-3 text-success">
                  {formMessage}
                </p>
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBRow>
      </MDBContainer>
    </form>
  );
};

export default InfoForm;