import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiRequest, errorMessage } from '../lib/api';
import { loadProfile } from '../lib/admin';
import { useSession } from '../stores/session';

export const loginSchema = z.object({ email: z.string().trim().email('Geçerli bir e-posta adresi yazın.'), password: z.string().min(1, 'Lütfen şifrenizi yazın.') });
export function Account() {
  const navigate = useNavigate();
  const { token, email, profile, setSession, logout } = useSession();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const login = async (values: z.infer<typeof loginSchema>) => {
    try {
      const result = z.object({ token: z.string().min(1) }).parse(await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(values), context: 'login' }));
      const user = await loadProfile(result.token);
      setSession(result.token, user.email, user); resetField('password'); toast.success('Başarıyla giriş yaptınız. Hoş geldiniz!');
      if (user.role === 'ADMIN') navigate('/yonetim');
    } catch (error) { const message = errorMessage(error); setError('root', { message }); toast.error(message); }
  };
  return <div className="shell account-layout"><div className="account-editorial"><img src="/assets/kado-editorial-campaign.png" alt="Kado Moda yeni sezon seçkisi" /><div><span className="eyebrow">KADO MODA DÜNYASINA</span><h1>Hoş geldiniz.</h1><p>Kendinize ait olanı keşfedin.</p></div></div><section className="account-panel">{token ? <><span className="eyebrow">HESABIM</span><h2>Tekrar merhaba.</h2><p>{email}</p>{profile?.role === 'ADMIN' && <Link to="/yonetim" className="btn btn-primary">Mağazayı yönet <ArrowRight size={18} /></Link>}<div className="notice">Girişiniz doğrulandı. Hesap yönetimi ve sipariş takibi sonraki aşamada açılacaktır. Sayfayı yenilediğinizde yeniden giriş yapmanız gerekir.</div><Link to="/koleksiyon" className="btn btn-primary">Koleksiyona dön <ArrowRight size={18} /></Link><button className="text-link" onClick={() => { logout(); toast.success('Güvenli bir şekilde çıkış yaptınız.'); }}><LogOut size={16} /> Çıkış yap</button></> : <><span className="eyebrow">HESABIM</span><h2>Giriş yap</h2><p className="muted">Mevcut Kado Moda hesabınızla devam edin.</p><form noValidate onSubmit={handleSubmit(login)} className="account-form"><label htmlFor="email">E-posta adresi</label><input id="email" className="input" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <span className="field-error" role="alert" id="email-error">{errors.email.message}</span>}<label htmlFor="password">Şifre</label><div className="password-field"><input id="password" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} /><button type="button" className="icon-button" aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <span className="field-error" role="alert" id="password-error">{errors.password.message}</span>}{errors.root && <p className="field-error" role="alert">{errors.root.message}</p>}<button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="loading loading-spinner loading-sm" /> Giriş yapılıyor…</> : <>Giriş yap <ArrowRight size={18} /></>}</button></form><p className="notice">Mağazamız hazırlanıyor. Yeni üyelik, şifre yenileme ve hesap yönetimi henüz açık değildir.</p></>}</section></div>;
}
