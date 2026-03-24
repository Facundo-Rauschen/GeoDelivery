import React from 'react';
import { Save, ChevronRight } from 'lucide-react';
import { Button, Card, Input } from '../../../components/ui';

const FormularioLogistica = ({ seccion, formulario, setFormulario, onGuardar, depositos }) => {

  const regexPatente = "[A-Za-z]{3}-[A-Za-z0-9]{3}";

  return (
    <Card className="sticky top-8 border-t-4 border-t-blue-600 shadow-xl">
      <h2 className="text-lg font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
        <ChevronRight className="text-blue-600" /> Nuevo {seccion.slice(0, -1)}
      </h2>

      <form onSubmit={onGuardar} className="space-y-4">
        <Input
          label={seccion === 'vehiculos' ? "Patente" : "Nombre"}
          value={formulario.nombre}
          onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
          required

          {...(seccion === 'vehiculos' && {
            pattern: regexPatente,
            title: "La patente debe tener el formato: 3 letras, un guion y 3 caracteres (Ej: ABC-123)",
            placeholder: "ABC-123",
            className: "uppercase" 
          })}
        />

        {seccion === 'vehiculos' ? (
          <>
            <Input
              label="Modelo"
              value={formulario.modelo}
              onChange={e => setFormulario({ ...formulario, modelo: e.target.value })}
              required
            />
            <select
              className="w-full px-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formulario.deposito_id}
              onChange={e => setFormulario({ ...formulario, deposito_id: e.target.value })}
            >
              <option value="">Sin depósito asignado</option>
              {depositos.map(dep => <option key={dep.id} value={dep.id}>{dep.nombre}</option>)}
            </select>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitud" type="number" step="any" value={formulario.lat}
              onChange={e => setFormulario({ ...formulario, lat: e.target.value })} required />
            <Input label="Longitud" type="number" step="any" value={formulario.lng}
              onChange={e => setFormulario({ ...formulario, lng: e.target.value })} required />
          </div>
        )}

        <Button variant="primary" type="submit" className="w-full py-4 font-bold uppercase tracking-widest">
          <Save size={18} /> Registrar
        </Button>
      </form>
    </Card>
  );
};

export default FormularioLogistica;