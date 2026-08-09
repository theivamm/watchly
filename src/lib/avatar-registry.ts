import type { UserAvatar } from "@/types";

import img1 from "@/assets/avatar/01-el-quimico.png";
import img2 from "@/assets/avatar/02-el-companero-ansioso.png";
import img3 from "@/assets/avatar/03-el-sheriff-no-muerto.png";
import img4 from "@/assets/avatar/04-la-vidente-gotica.png";
import img5 from "@/assets/avatar/05-el-estratega-rojo.png";
import img6 from "@/assets/avatar/06-el-elegido.png";
import img7 from "@/assets/avatar/07-el-pirata-bromista.png";
import img8 from "@/assets/avatar/08-el-arquitecto-de-suenos.png";
import img9 from "@/assets/avatar/09-la-nina-psiquica.png";
import img10 from "@/assets/avatar/10-la-diplomatica-galactica.png";
import img11 from "@/assets/avatar/11-la-novia-samurai.png";
import img12 from "@/assets/avatar/12-el-profesor-de-reliquias.png";
import img13 from "@/assets/avatar/13-la-investigadora-esceptica.png";
import img14 from "@/assets/avatar/14-el-creyente-paranormal.png";
import img15 from "@/assets/avatar/15-la-forma-silenciosa.png";
import img16 from "@/assets/avatar/16-el-showman-de-pesadillas.png";
import img17 from "@/assets/avatar/17-el-cazador-de-la-jungla.png";
import img18 from "@/assets/avatar/18-el-guardian-del-futuro.png";
import img19 from "@/assets/avatar/19-el-boxeador.png";
import img20 from "@/assets/avatar/20-el-patriarca.png";
import img21 from "@/assets/avatar/21-el-estudiante-de-magia.png";
import img22 from "@/assets/avatar/22-el-arquero-plateado.png";
import img23 from "@/assets/avatar/23-el-portador-del-anillo.png";
import img24 from "@/assets/avatar/24-la-monarca-de-dragones.png";
import img25 from "@/assets/avatar/25-el-heredero-del-norte.png";
import img26 from "@/assets/avatar/26-el-aprendiz-de-quimica.png";
import img27 from "@/assets/avatar/27-el-abogado-colorido.png";
import img28 from "@/assets/avatar/28-el-jefe-de-oficina.png";
import img29 from "@/assets/avatar/29-la-fashionista-del-cafe.png";
import img30 from "@/assets/avatar/30-el-doctor-de-la-isla.png";
import img31 from "@/assets/avatar/31-la-tirana-de-la-moda.png";
import img32 from "@/assets/avatar/32-la-fisica-perfecta.png";
import img33 from "@/assets/avatar/33-el-capitan-sin-escudo.png";
import img34 from "@/assets/avatar/34-el-inventor-armado.png";
import img35 from "@/assets/avatar/35-el-gigante-verde.png";
import img36 from "@/assets/avatar/36-el-principe-de-la-tormenta.png";
import img37 from "@/assets/avatar/37-el-filosofo-azul.png";
import img38 from "@/assets/avatar/38-el-velocista-escarlata.png";
import img39 from "@/assets/avatar/39-el-heredero-del-oceano.png";
import img40 from "@/assets/avatar/40-la-bruja-de-la-realidad.png";

// Registro estático de los 40 avatares. El orden (id 1..40) coincide 1:1 con
// las filas de la tabla public.avatars (ids fijos) y con los archivos en
// src/assets/avatar/. Al no depender de la columna image_url de la base, los
// avatares se sirven desde el bundle de Vite (hashing estable por contenido) y
// no requieren rebuilds de infraestructura cuando se cambian los avatares.
const AVATARS: UserAvatar[] = [
  { id: 1, name: 'El quimico', slug: 'av-01-el-quimico', style: "static", seed: 'av-01-el-quimico', image_url: img1, category: "face", is_active: true, sort_order: 1, created_at: "" },
  { id: 2, name: 'El companero ansioso', slug: 'av-02-el-companero-ansioso', style: "static", seed: 'av-02-el-companero-ansioso', image_url: img2, category: "face", is_active: true, sort_order: 2, created_at: "" },
  { id: 3, name: 'El sheriff no muerto', slug: 'av-03-el-sheriff-no-muerto', style: "static", seed: 'av-03-el-sheriff-no-muerto', image_url: img3, category: "face", is_active: true, sort_order: 3, created_at: "" },
  { id: 4, name: 'La vidente gotica', slug: 'av-04-la-vidente-gotica', style: "static", seed: 'av-04-la-vidente-gotica', image_url: img4, category: "face", is_active: true, sort_order: 4, created_at: "" },
  { id: 5, name: 'El estratega rojo', slug: 'av-05-el-estratega-rojo', style: "static", seed: 'av-05-el-estratega-rojo', image_url: img5, category: "face", is_active: true, sort_order: 5, created_at: "" },
  { id: 6, name: 'El elegido', slug: 'av-06-el-elegido', style: "static", seed: 'av-06-el-elegido', image_url: img6, category: "face", is_active: true, sort_order: 6, created_at: "" },
  { id: 7, name: 'El pirata bromista', slug: 'av-07-el-pirata-bromista', style: "static", seed: 'av-07-el-pirata-bromista', image_url: img7, category: "face", is_active: true, sort_order: 7, created_at: "" },
  { id: 8, name: 'El arquitecto de suenos', slug: 'av-08-el-arquitecto-de-suenos', style: "static", seed: 'av-08-el-arquitecto-de-suenos', image_url: img8, category: "face", is_active: true, sort_order: 8, created_at: "" },
  { id: 9, name: 'La nina psiquica', slug: 'av-09-la-nina-psiquica', style: "static", seed: 'av-09-la-nina-psiquica', image_url: img9, category: "face", is_active: true, sort_order: 9, created_at: "" },
  { id: 10, name: 'La diplomatica galactica', slug: 'av-10-la-diplomatica-galactica', style: "static", seed: 'av-10-la-diplomatica-galactica', image_url: img10, category: "face", is_active: true, sort_order: 10, created_at: "" },
  { id: 11, name: 'La novia samurai', slug: 'av-11-la-novia-samurai', style: "static", seed: 'av-11-la-novia-samurai', image_url: img11, category: "face", is_active: true, sort_order: 11, created_at: "" },
  { id: 12, name: 'El profesor de reliquias', slug: 'av-12-el-profesor-de-reliquias', style: "static", seed: 'av-12-el-profesor-de-reliquias', image_url: img12, category: "face", is_active: true, sort_order: 12, created_at: "" },
  { id: 13, name: 'La investigadora esceptica', slug: 'av-13-la-investigadora-esceptica', style: "static", seed: 'av-13-la-investigadora-esceptica', image_url: img13, category: "face", is_active: true, sort_order: 13, created_at: "" },
  { id: 14, name: 'El creyente paranormal', slug: 'av-14-el-creyente-paranormal', style: "static", seed: 'av-14-el-creyente-paranormal', image_url: img14, category: "face", is_active: true, sort_order: 14, created_at: "" },
  { id: 15, name: 'La forma silenciosa', slug: 'av-15-la-forma-silenciosa', style: "static", seed: 'av-15-la-forma-silenciosa', image_url: img15, category: "face", is_active: true, sort_order: 15, created_at: "" },
  { id: 16, name: 'El showman de pesadillas', slug: 'av-16-el-showman-de-pesadillas', style: "static", seed: 'av-16-el-showman-de-pesadillas', image_url: img16, category: "face", is_active: true, sort_order: 16, created_at: "" },
  { id: 17, name: 'El cazador de la jungla', slug: 'av-17-el-cazador-de-la-jungla', style: "static", seed: 'av-17-el-cazador-de-la-jungla', image_url: img17, category: "face", is_active: true, sort_order: 17, created_at: "" },
  { id: 18, name: 'El guardian del futuro', slug: 'av-18-el-guardian-del-futuro', style: "static", seed: 'av-18-el-guardian-del-futuro', image_url: img18, category: "face", is_active: true, sort_order: 18, created_at: "" },
  { id: 19, name: 'El boxeador', slug: 'av-19-el-boxeador', style: "static", seed: 'av-19-el-boxeador', image_url: img19, category: "face", is_active: true, sort_order: 19, created_at: "" },
  { id: 20, name: 'El patriarca', slug: 'av-20-el-patriarca', style: "static", seed: 'av-20-el-patriarca', image_url: img20, category: "face", is_active: true, sort_order: 20, created_at: "" },
  { id: 21, name: 'El estudiante de magia', slug: 'av-21-el-estudiante-de-magia', style: "static", seed: 'av-21-el-estudiante-de-magia', image_url: img21, category: "face", is_active: true, sort_order: 21, created_at: "" },
  { id: 22, name: 'El arquero plateado', slug: 'av-22-el-arquero-plateado', style: "static", seed: 'av-22-el-arquero-plateado', image_url: img22, category: "face", is_active: true, sort_order: 22, created_at: "" },
  { id: 23, name: 'El portador del anillo', slug: 'av-23-el-portador-del-anillo', style: "static", seed: 'av-23-el-portador-del-anillo', image_url: img23, category: "face", is_active: true, sort_order: 23, created_at: "" },
  { id: 24, name: 'La monarca de dragones', slug: 'av-24-la-monarca-de-dragones', style: "static", seed: 'av-24-la-monarca-de-dragones', image_url: img24, category: "face", is_active: true, sort_order: 24, created_at: "" },
  { id: 25, name: 'El heredero del norte', slug: 'av-25-el-heredero-del-norte', style: "static", seed: 'av-25-el-heredero-del-norte', image_url: img25, category: "face", is_active: true, sort_order: 25, created_at: "" },
  { id: 26, name: 'El aprendiz de quimica', slug: 'av-26-el-aprendiz-de-quimica', style: "static", seed: 'av-26-el-aprendiz-de-quimica', image_url: img26, category: "face", is_active: true, sort_order: 26, created_at: "" },
  { id: 27, name: 'El abogado colorido', slug: 'av-27-el-abogado-colorido', style: "static", seed: 'av-27-el-abogado-colorido', image_url: img27, category: "face", is_active: true, sort_order: 27, created_at: "" },
  { id: 28, name: 'El jefe de oficina', slug: 'av-28-el-jefe-de-oficina', style: "static", seed: 'av-28-el-jefe-de-oficina', image_url: img28, category: "face", is_active: true, sort_order: 28, created_at: "" },
  { id: 29, name: 'La fashionista del cafe', slug: 'av-29-la-fashionista-del-cafe', style: "static", seed: 'av-29-la-fashionista-del-cafe', image_url: img29, category: "face", is_active: true, sort_order: 29, created_at: "" },
  { id: 30, name: 'El doctor de la isla', slug: 'av-30-el-doctor-de-la-isla', style: "static", seed: 'av-30-el-doctor-de-la-isla', image_url: img30, category: "face", is_active: true, sort_order: 30, created_at: "" },
  { id: 31, name: 'La tirana de la moda', slug: 'av-31-la-tirana-de-la-moda', style: "static", seed: 'av-31-la-tirana-de-la-moda', image_url: img31, category: "face", is_active: true, sort_order: 31, created_at: "" },
  { id: 32, name: 'La fisica perfecta', slug: 'av-32-la-fisica-perfecta', style: "static", seed: 'av-32-la-fisica-perfecta', image_url: img32, category: "face", is_active: true, sort_order: 32, created_at: "" },
  { id: 33, name: 'El capitan sin escudo', slug: 'av-33-el-capitan-sin-escudo', style: "static", seed: 'av-33-el-capitan-sin-escudo', image_url: img33, category: "face", is_active: true, sort_order: 33, created_at: "" },
  { id: 34, name: 'El inventor armado', slug: 'av-34-el-inventor-armado', style: "static", seed: 'av-34-el-inventor-armado', image_url: img34, category: "face", is_active: true, sort_order: 34, created_at: "" },
  { id: 35, name: 'El gigante verde', slug: 'av-35-el-gigante-verde', style: "static", seed: 'av-35-el-gigante-verde', image_url: img35, category: "face", is_active: true, sort_order: 35, created_at: "" },
  { id: 36, name: 'El principe de la tormenta', slug: 'av-36-el-principe-de-la-tormenta', style: "static", seed: 'av-36-el-principe-de-la-tormenta', image_url: img36, category: "face", is_active: true, sort_order: 36, created_at: "" },
  { id: 37, name: 'El filosofo azul', slug: 'av-37-el-filosofo-azul', style: "static", seed: 'av-37-el-filosofo-azul', image_url: img37, category: "face", is_active: true, sort_order: 37, created_at: "" },
  { id: 38, name: 'El velocista escarlata', slug: 'av-38-el-velocista-escarlata', style: "static", seed: 'av-38-el-velocista-escarlata', image_url: img38, category: "face", is_active: true, sort_order: 38, created_at: "" },
  { id: 39, name: 'El heredero del oceano', slug: 'av-39-el-heredero-del-oceano', style: "static", seed: 'av-39-el-heredero-del-oceano', image_url: img39, category: "face", is_active: true, sort_order: 39, created_at: "" },
  { id: 40, name: 'La bruja de la realidad', slug: 'av-40-la-bruja-de-la-realidad', style: "static", seed: 'av-40-la-bruja-de-la-realidad', image_url: img40, category: "face", is_active: true, sort_order: 40, created_at: "" },
];

export default AVATARS;

const INDEX = new Map(AVATARS.map((a) => [a.id, a]));

export function getAvatarById(id: number | string | null | undefined): UserAvatar | undefined {
  if (id == null) return undefined;
  return INDEX.get(Number(id));
}

export function listAvatars(): UserAvatar[] {
  return AVATARS;
}
