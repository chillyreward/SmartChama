import { CompareFacesCommand, DetectFacesCommand, RekognitionClient } from '@aws-sdk/client-rekognition'

// Compares the live selfie with the face on the ID document.
//
// Provider: AWS Rekognition (CompareFaces), enabled when REKOGNITION_* env vars
// are set. Without them every submission goes to manual staff review. Another
// provider (e.g. Smile ID, which also checks the ID number against IPRS) can
// implement FaceMatcher and be returned from getFaceMatcher().

export type FaceMatchResult =
  | { outcome: 'match' | 'no_match' | 'uncertain'; similarity: number; provider: string }
  | { outcome: 'retake'; reason: string; provider: string }
  | { outcome: 'unavailable'; provider: 'none' }

export interface FaceMatcher {
  readonly name: string
  compare(selfie: Uint8Array, idPhoto: Uint8Array): Promise<FaceMatchResult>
}

// Similarity (0-100) cut-offs. Above MATCH: verified automatically.
// Below NO_MATCH: rejected. In between: a person reviews it.
const MATCH = 95
const NO_MATCH = 80

class RekognitionMatcher implements FaceMatcher {
  readonly name = 'aws-rekognition'
  private client: RekognitionClient

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.client = new RekognitionClient({ region, credentials: { accessKeyId, secretAccessKey } })
  }

  async compare(selfie: Uint8Array, idPhoto: Uint8Array): Promise<FaceMatchResult> {
    // The selfie must show exactly one clear, open-eyed face
    const detected = await this.client.send(new DetectFacesCommand({ Image: { Bytes: selfie }, Attributes: ['ALL'] }))
    const faces = detected.FaceDetails ?? []
    if (faces.length === 0) return { outcome: 'retake', reason: "We couldn't see your face. Retake the selfie in good light, facing the camera.", provider: this.name }
    if (faces.length > 1) return { outcome: 'retake', reason: 'Only you should be in the selfie. Please retake it.', provider: this.name }
    const f = faces[0]
    if (f.Sunglasses?.Value) return { outcome: 'retake', reason: 'Please remove sunglasses and retake the selfie.', provider: this.name }
    if (f.EyesOpen && f.EyesOpen.Value === false) return { outcome: 'retake', reason: 'Keep your eyes open and retake the selfie.', provider: this.name }

    try {
      const res = await this.client.send(new CompareFacesCommand({
        SourceImage: { Bytes: selfie },
        TargetImage: { Bytes: idPhoto },
        SimilarityThreshold: 0,
      }))
      const best = Math.max(0, ...(res.FaceMatches ?? []).map((m) => m.Similarity ?? 0))
      const outcome = best >= MATCH ? 'match' : best < NO_MATCH ? 'no_match' : 'uncertain'
      return { outcome, similarity: Math.round(best * 100) / 100, provider: this.name }
    } catch (err: any) {
      if (err?.name === 'InvalidParameterException') {
        return { outcome: 'retake', reason: "We couldn't find a face on the ID photo. Retake it flat, in good light, with no glare.", provider: this.name }
      }
      throw err
    }
  }
}

class NoMatcher implements FaceMatcher {
  readonly name = 'none'
  async compare(): Promise<FaceMatchResult> {
    return { outcome: 'unavailable', provider: 'none' }
  }
}

export function getFaceMatcher(): FaceMatcher {
  const { REKOGNITION_REGION, REKOGNITION_ACCESS_KEY_ID, REKOGNITION_SECRET_ACCESS_KEY } = process.env
  if (REKOGNITION_REGION && REKOGNITION_ACCESS_KEY_ID && REKOGNITION_SECRET_ACCESS_KEY) {
    return new RekognitionMatcher(REKOGNITION_REGION, REKOGNITION_ACCESS_KEY_ID, REKOGNITION_SECRET_ACCESS_KEY)
  }
  return new NoMatcher()
}
