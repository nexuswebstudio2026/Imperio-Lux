import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  initialEmpresa,
  initialMonedas,
  initialDocumentos,
  initialCategorias,
  initialPresentaciones,
  initialMarcas,
  initialProductos,
  initialClientes,
  initialProveedores,
  initialComprobantes,
  initialVentas,
  initialCompras,
  initialCajas,
  initialMovimientosCaja,
  initialInventarioAjustes,
  initialKardex,
  initialEmpleados,
  initialRoles,
  initialUsers,
  initialActivityLogs,
  initialNotificaciones,
} from '../src/data/initialData.ts';

async function main() {
  console.log('Reading firebase-applet-config.json...');
  const configRaw = readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
  const config = JSON.parse(configRaw);

  console.log('Target Project ID:', config.projectId);
  console.log('Target Database ID:', config.firestoreDatabaseId);

  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);

  const collections = [
    { name: 'empresas', data: [initialEmpresa] },
    { name: 'monedas', data: initialMonedas },
    { name: 'documentos', data: initialDocumentos },
    { name: 'comprobantes', data: initialComprobantes },
    { name: 'categorias', data: initialCategorias },
    { name: 'presentaciones', data: initialPresentaciones },
    { name: 'marcas', data: initialMarcas },
    { name: 'productos', data: initialProductos },
    { name: 'clientes', data: initialClientes },
    { name: 'proveedores', data: initialProveedores },
    { name: 'empleados', data: initialEmpleados },
    { name: 'cajas', data: initialCajas },
    { name: 'movimientos_caja', data: initialMovimientosCaja },
    { name: 'ventas', data: initialVentas },
    { name: 'compras', data: initialCompras },
    { name: 'inventario_ajustes', data: initialInventarioAjustes },
    { name: 'kardex', data: initialKardex },
    { name: 'users', data: initialUsers },
    { name: 'roles', data: initialRoles },
    { name: 'activity_logs', data: initialActivityLogs },
    { name: 'notificaciones', data: initialNotificaciones },
  ];

  console.log(`Starting to seed ${collections.length} collections into Firestore...`);

  for (const col of collections) {
    console.log(`Saving collection: ${col.name} (${col.data.length} docs)...`);
    const batch = writeBatch(db);
    for (const item of col.data) {
      const docRef = doc(db, col.name, String((item as any).id || (item as any).codigo || Math.random().toString()));
      batch.set(docRef, item, { merge: true });
    }
    await batch.commit();
    console.log(`  ✓ ${col.name} seeded successfully!`);
  }

  console.log('\n🎉 ALL 21 COLLECTIONS HAVE BEEN POPULATED IN FIRESTORE SUCCESSFULLY!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed firestore:', err);
  process.exit(1);
});
