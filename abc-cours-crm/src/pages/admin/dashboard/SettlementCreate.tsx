import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  Button,
  Input,
} from "../../../components";
import { settlementService } from "../../../services/settlementService";
import { subjectService } from "../../../services/subjectService";
import type { CreateSettlementNoteData } from "../../../types/settlement";
import type { Subject } from "../../../types/subject";

export const SettlementCreate: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<CreateSettlementNoteData>({
    clientName: "",
    department: "",
    paymentMethod: "card",
    subjectId: "",
    hourlyRate: 0,
    quantity: 1,
    professorSalary: 0,
    charges: 0,
    dueDate: new Date(),
    notes: "",
  });

  // Charger les matières
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await subjectService.getSubjects();
        setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur lors du chargement des matières:", err);
      }
    };

    loadSubjects();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await settlementService.createSettlementNote(formData);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div>
      <Navbar activePath="/admin/dashboard" />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tableau de bord", href: "/admin/dashboard" },
          { label: "Créer une NDR", href: "/admin/dashboard/create" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Créer une note de règlement</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Container layout="grid" padding="none">
            {/* Informations client */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations client</h3>

              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nom du client *
                </label>
                <Input
                  id="clientName"
                  name="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nom du client"
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Département *
                </label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  placeholder="Département"
                />
              </div>

              <div>
                <label
                  htmlFor="paymentMethod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mode de règlement *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="card">Carte</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>
            </div>

            {/* Informations cours */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations cours</h3>

              <div>
                <label
                  htmlFor="subjectId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Matière *
                </label>
                <select
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="hourlyRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tarif horaire (€) *
                </label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantité (heures) *
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  placeholder="1"
                />
              </div>
            </div>

            {/* Informations financières */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Informations financières
              </h3>

              <div>
                <label
                  htmlFor="professorSalary"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Salaire du professeur (€/h) *
                </label>
                <Input
                  id="professorSalary"
                  name="professorSalary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.professorSalary}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="charges"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Charges (€/h) *
                </label>
                <Input
                  id="charges"
                  name="charges"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.charges}
                  onChange={handleInputChange}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date d'échéance *
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate.toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </Container>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Calculs automatiques */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Calculs automatiques</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Salaire à verser:</span>
                <span className="ml-2 font-medium">
                  {(formData.professorSalary * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Charges à verser:</span>
                <span className="ml-2 font-medium">
                  {(formData.charges * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Montant total:</span>
                <span className="ml-2 font-medium">
                  {(formData.hourlyRate * formData.quantity).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-600">Marge:</span>
                <span className="ml-2 font-medium">
                  {(
                    formData.hourlyRate * formData.quantity -
                    formData.professorSalary * formData.quantity -
                    formData.charges * formData.quantity
                  ).toFixed(2)}{" "}
                  €
                </span>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <Container layout="flex">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Création..." : "Créer la note de règlement"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
          </Container>
        </form>
      </Container>
    </div>
  );
};
