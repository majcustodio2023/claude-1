// Atmosphere photography for /rdr (Unsplash, free licence, credited in the footer). None of these
// are presented as RDR's own; RDR's own pictures replace them through lib/rdr/assets.ts.

export interface Photo {
  src: string;
  alt: string;
  credit: string;
  link: string;
}

const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const photos = {
  studioCamera: { src: u("photo-1671575584088-03eb2811c30f"), alt: "A studio camera in front of a red wall", credit: "Konrad Weber", link: "https://unsplash.com/photos/Re9nJ5Q7RCo" },
  tvStudio: { src: u("photo-1651465531201-7e430660fd82"), alt: "A television news studio", credit: "Brad Weaver", link: "https://unsplash.com/photos/qhamVJdrkRs" },
  interviewMonitor: { src: u("photo-1637159147941-cffa2aafc059"), alt: "A camera monitor on an interview shoot", credit: "Leuchtturm Entertainment", link: "https://unsplash.com/photos/boCDlcZvaJI" },
  cameraRecording: { src: u("photo-1698199071311-bd5fe0e37449"), alt: "A camera recording a person speaking", credit: "Albert Stoynov", link: "https://unsplash.com/photos/QEf3mq665qU" },
  broadcastCamera: { src: u("photo-1784267978404-68aab6311873"), alt: "A broadcast camera with its tally light on", credit: "Manuel Luikenga", link: "https://unsplash.com/photos/SSXsHvcvrUE" },
  stageSpeaker: { src: u("photo-1587825140708-dfaf72ae4b04"), alt: "A speaker on stage in front of a large audience", credit: "Alexandre Pellaes", link: "https://unsplash.com/photos/6vAjp0pscX0" },
  audienceScreen: { src: u("photo-1627931539006-d5c4677e05ea"), alt: "An audience watching a speaker on a bright screen", credit: "Kevin Gonzalez", link: "https://unsplash.com/photos/-NXNaE9lu6w" },
  manilaNight: { src: u("photo-1602253396430-e805dc528e97"), alt: "The Manila Bay skyline at night", credit: "Paolo Syiaco", link: "https://unsplash.com/photos/-YwWOQLoYOI" },
  manilaCity: { src: u("photo-1581216340441-d47cad9210a4"), alt: "Manila city skyline at night", credit: "David Milmont", link: "https://unsplash.com/photos/3WX60TlLIdw" },
  barbershop: { src: u("photo-1792523297859-6b92444b583c"), alt: "Black and gold barber chairs in a modern salon", credit: "Mustafa Sheikhmouss", link: "https://unsplash.com/photos/yNb_SF84rJw" },
  industrial: { src: u("photo-1717386255773-a456c611dc4e"), alt: "An industrial manufacturing machine control panel", credit: "Homa Appliances", link: "https://unsplash.com/photos/_XDK4naBbgw" },
  skincare: { src: u("photo-1697638044627-683663954a37"), alt: "A product bottle on a dark background", credit: "Lal Mahammad", link: "https://unsplash.com/photos/RTztvMao8oc" },
  podcastMic: { src: u("photo-1589903308904-1010c2294adc"), alt: "A podcast microphone and headphones", credit: "Will Francis", link: "https://unsplash.com/photos/ZDNyhmgkZlQ" },
  condenserMic: { src: u("photo-1478737270239-2f02b77fc618"), alt: "A condenser microphone in a studio", credit: "Jonathan Velasquez", link: "https://unsplash.com/photos/c1ZN57GfDB0" },
  handshake: { src: u("photo-1521791136064-7986c2920216"), alt: "Two people shaking hands", credit: "Cytonn Photography", link: "https://unsplash.com/photos/n95VMLxqM2I" },
  filmSet: { src: u("photo-1632187981988-40f3cbaeef5e"), alt: "A crew around a cinema camera on set", credit: "Jakob Owens", link: "https://unsplash.com/photos/xKfS7Hll0Ck" },
  ledLight: { src: u("photo-1762028895256-1256ffcbaf16"), alt: "A professional LED light with barn doors", credit: "Hossein Nasr", link: "https://unsplash.com/photos/siQ-Ew2R25g" },
  cinemaCamera: { src: u("photo-1543235074-4768b5c2233c"), alt: "A shoulder-mount cinema camera", credit: "Vanilla Bear Films", link: "https://unsplash.com/photos/Wnly2mV4YKw" },
} satisfies Record<string, Photo>;

export const photoCredits: Photo[] = Object.values(photos);

/** YouTube thumbnail for a video id. */
export const yt = (id: string, size: "hq" | "mq" | "max" = "hq") => `https://i.ytimg.com/vi/${id}/${size === "max" ? "maxresdefault" : size === "mq" ? "mqdefault" : "hqdefault"}.jpg`;
