'use client';
import React, { useState } from 'react';

export default function Page() {
  const [claims, setClaims] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

async function handleGenerate(payload: {
  title_ko?: string; notes?: string; claims_text: string;
}) {
  setError?.('');
  setLoading?.(true);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 에러 응답은 그대로 표시(클라이언트가 죽지 않게)
    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();
    if (!res.ok) {
      throw new Error(`[${res.status}] ${bodyText || 'Request failed'}`);
    }

    // JSON/텍스트 둘 다 안전하게 처리
    const data = contentType.includes('application/json')
      ? JSON.parse(bodyText)
      : JSON.parse(bodyText); // 서버가 항상 JSON으로 주므로 대부분 이 줄로 처리됩니다.

    // 화면에 반영
    // 우측 결과창이 '명세서 텍스트'라면 이걸로 쓰세요:
    setSpecText?.(data?.spec_text ?? JSON.stringify(data, null, 2));
    // (미리보기 전용 상태가 없다면, 콘솔로만 확인해도 됩니다)
    // console.log('API result:', data);

    
  } catch (err: any) {
    alert?.(String(err?.message || err));
    setError?.(String(err?.message || err));
  } finally {
    setLoading?.(false);
  }
}

  return (
    <div className="container">
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h1>특허 명세서 자동 생성기</h1>
        <div className="small">Claims → Spec Draft</div>
      </header>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <div className="card">
          <div>
            <label className="label">발명의 명칭 (선택)</label>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="예) 초음파 기반 미세액적 토출 장치" />
          </div>
          <div style={{marginTop: 12}}>
            <label className="label">메모 (과제/효과/실험/캡션 등, 선택)</label>
            <textarea className="textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="예) 0.9~3 MHz, 유량 5~20 mL/min, 노즐/진동자/제어부 도면" />
          </div>
          <div style={{marginTop: 12}}>
            <label className="label">청구범위 (필수)</label>
            <textarea className="textarea" value={claims} onChange={e=>setClaims(e.target.value)} placeholder={'1. ...\n2. ...\n3. ...'} />
          </div>
          <div style={{marginTop: 12, display: 'flex', gap: 8, alignItems:'center'}}>
            <button className="btn" disabled={loading || !claims.trim()} onClick={handleGenerate}>{loading ? '생성 중...' : '명세서 초안 생성'}</button>
            {error && <span style={{color:'#dc2626', fontSize:12}}>{error}</span>}
          </div>
        </div>

        <div className="card">
          {!result && (
            <div>
              <h3>진행 상태</h3>
              <ul className="small">
                <li>입력 확인 → 섹션 설계 → 초안 생성 → 점검 → 리라이팅</li>
                <li>백엔드에서 JSON 스키마로 구조화해 반환합니다.</li>
                <li>과도한 한정 표현은 risky_limitations로 표시됩니다.</li>
              </ul>
            </div>
          )}

          {result?.consistency_report && (
            <div>
              <h3>점검 결과 (Consistency)</h3>
              <p className="small"><b>Antecedent:</b> {result.consistency_report.antecedent_ok ? 'OK' : '확인 필요'}</p>
              {Array.isArray(result.consistency_report.term_map) && result.consistency_report.term_map.length > 0 && (
                <div>
                  <div className="small" style={{fontWeight:700}}>용어 매핑</div>
                  <ul>
                    {result.consistency_report.term_map.map((t:string, i:number)=>(<li key={i} className="small">{t}</li>))}
                  </ul>
                </div>
              )}
              {Array.isArray(result.consistency_report.risky_limitations) && result.consistency_report.risky_limitations.length > 0 && (
                <div>
                  <div className="small" style={{fontWeight:700}}>과도한 한정(주의)</div>
                  <ul>
                    {result.consistency_report.risky_limitations.map((t:string, i:number)=>(<li key={i} className="small">{t}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result?.sections && (
            <div>
              <h3>명세서 초안 미리보기</h3>
              <div>
                {result.sections.background && (<div><div style={{fontWeight:600}}>배경기술</div><p>{result.sections.background}</p></div>)}
                {result.sections.summary && (<div><div style={{fontWeight:600}}>발명의 요지</div><p>{result.sections.summary}</p></div>)}
                {Array.isArray(result.sections.brief_drawings) && result.sections.brief_drawings.length>0 && (
                  <div><div style={{fontWeight:600}}>도면의 간단한 설명</div><ul>{result.sections.brief_drawings.map((d:string,i:number)=>(<li key={i}>{d}</li>))}</ul></div>
                )}
                {Array.isArray(result.sections.detailed) && result.sections.detailed.length>0 && (
                  <div><div style={{fontWeight:600}}>실시예(상세한 설명)</div>
                    {result.sections.detailed.map((emb:any,i:number)=>(
                      <div key={i} className="card" style={{padding:12, marginTop:8}}>
                        <div style={{fontWeight:600}}>{emb.embodiment_title || `실시예 ${i+1}`}</div>
                        {Array.isArray(emb.steps) && (<ol>{emb.steps.map((s:string,j:number)=>(<li key={j} className="small">{s}</li>))}</ol>)}
                        {Array.isArray(emb.advantages) && emb.advantages.length>0 && (
                          <div>
                            <div className="small" style={{fontWeight:700, marginTop:6}}>장점</div>
                            <ul>{emb.advantages.map((a:string,k:number)=>(<li key={k} className="small">{a}</li>))}</ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(result.sections.effects) && result.sections.effects.length>0 && (
                  <div><div style={{fontWeight:600}}>효과</div><ul>{result.sections.effects.map((e:string,i:number)=>(<li key={i}>{e}</li>))}</ul></div>
                )}
                {Array.isArray(result.sections.variations) && result.sections.variations.length>0 && (
                  <div><div style={{fontWeight:600}}>변형예</div><ul>{result.sections.variations.map((v:string,i:number)=>(<li key={i}>{v}</li>))}</ul></div>
                )}
                {Array.isArray(result.sections.definitions) && result.sections.definitions.length>0 && (
                  <div><div style={{fontWeight:600}}>용어정의</div><ul>{result.sections.definitions.map((d:string,i:number)=>(<li key={i}>{d}</li>))}</ul></div>
                )}
                {result.sections.industrial_applicability && (<div><div style={{fontWeight:600}}>산업상 이용가능성</div><p>{result.sections.industrial_applicability}</p></div>)}
                {Array.isArray(result.sections.ref_numerals) && result.sections.ref_numerals.length>0 && (
                  <div><div style={{fontWeight:600}}>도면부호표</div><ul>{result.sections.ref_numerals.map((r:string,i:number)=>(<li key={i}>{r}</li>))}</ul></div>
                )}
                {result.sections.abstract_ko && (<div><div style={{fontWeight:600}}>요약서</div><p>{result.sections.abstract_ko}</p></div>)}
              </div>
            </div>
          )}

          {result && (
            <div>
              <h3>원본 JSON</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <footer style={{textAlign:'center', marginTop: 24}} className="small">
        © {new Date().getFullYear()} Spec Generator · Draft output only; legal review required before filing.
      </footer>
    </div>
  );
}
