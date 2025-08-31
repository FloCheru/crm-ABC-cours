# DataCard - Exemple d'utilisation

## Import
```typescript
import { DataCard } from "../components";
import type { FieldConfig } from "../components";
```

## Exemple complet

```typescript
import React, { useState } from "react";
import { DataCard } from "../components";
import type { FieldConfig } from "../components";

const ExamplePage: React.FC = () => {
  const [client, setClient] = useState({
    firstName: "Jean",
    lastName: "Dupont", 
    email: "jean.dupont@email.com",
    phone: "06 12 34 56 78",
    birthDate: "1985-03-15",
    description: "Client régulier depuis 2020",
    category: "premium",
    notes: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields: FieldConfig[] = [
    {
      key: "firstName",
      label: "Prénom", 
      value: client.firstName,
      type: "text",
      required: true,
      placeholder: "Entrez le prénom"
    },
    {
      key: "lastName",
      label: "Nom de famille",
      value: client.lastName, 
      type: "text",
      required: true,
      placeholder: "Entrez le nom"
    },
    {
      key: "email",
      label: "Adresse email",
      value: client.email,
      type: "email",
      placeholder: "email@exemple.com"
    },
    {
      key: "phone", 
      label: "Téléphone",
      value: client.phone,
      type: "tel",
      placeholder: "06 12 34 56 78"
    },
    {
      key: "birthDate",
      label: "Date de naissance",
      value: client.birthDate,
      type: "date"
    },
    {
      key: "category",
      label: "Catégorie client",
      value: client.category,
      type: "select",
      options: [
        { value: "", label: "Sélectionner une catégorie" },
        { value: "standard", label: "Standard" },
        { value: "premium", label: "Premium" },
        { value: "vip", label: "VIP" }
      ]
    },
    {
      key: "description",
      label: "Description",
      value: client.description,
      type: "textarea",
      placeholder: "Description détaillée du client"
    },
    {
      key: "notes",
      label: "Notes privées",
      value: client.notes,
      type: "textarea", 
      placeholder: "Notes internes (non visibles par le client)"
    }
  ];

  const handleChange = (key: string, value: any) => {
    setClient({ ...client, [key]: value });
    
    // Effacer l'erreur pour ce champ
    if (errors[key]) {
      setErrors({ ...errors, [key]: "" });
    }
  };

  const handleSave = () => {
    // Validation simple
    const newErrors: Record<string, string> = {};
    
    if (!client.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }
    
    if (!client.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }
    
    if (client.email && !client.email.includes("@")) {
      newErrors.email = "Email invalide";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Sauvegarder...
    console.log("Sauvegarde:", client);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>
            Modifier
          </button>
        ) : (
          <>
            <button onClick={handleSave}>Sauvegarder</button>
            <button onClick={() => {
              setIsEditing(false);
              setErrors({});
            }}>
              Annuler
            </button>
          </>
        )}
      </div>

      <DataCard
        title="Informations client"
        fields={fields}
        isEditing={isEditing}
        onChange={handleChange}
        errors={errors}
        className="custom-card"
      />
    </div>
  );
};
```

## Types supportés

- **text**: Input texte simple
- **email**: Input avec validation email
- **tel**: Input pour numéros de téléphone
- **number**: Input numérique
- **date**: Sélecteur de date
- **textarea**: Zone de texte multi-lignes
- **select**: Liste déroulante avec options

## Fonctionnalités

- ✅ Mode lecture/édition basculable
- ✅ Validation et affichage d'erreurs
- ✅ Support de tous les types d'input courants
- ✅ Formatage automatique en mode lecture
- ✅ Grille responsive
- ✅ Accessibilité (ARIA, focus, etc.)
- ✅ Styles cohérents avec le design system