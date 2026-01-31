import React, { useMemo, useState, useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export default function Pricing() {
    const { t } = useContext(LanguageContext);
    const [period, setPeriod] = useState("monthly");
    const nf = useMemo(() => new Intl.NumberFormat("tr-TR"), []);
    const calcYearly = (m) => Math.round(m * 12 * 0.80); // %20 indirim

    const plans = [
        {
            key: "free",
            monthly: 0,
            highlight: false
        },
        {
            key: "plus",
            monthly: 369,
            highlight: true // Popular moved to Plus
        },
        {
            key: "pro",
            monthly: 449, // Updated price
            highlight: false
        },
        {
            key: "enterprise",
            monthly: null,
            highlight: false
        }
    ];

    const Price = ({ monthly, planKey }) => {
        if (monthly === null) {
            return (
                <div className="my-3">
                    <div className="display-6 fw-bold text-white">{t('pricing.contactUs')}</div>
                    <div className="text-soft small">{t('pricing.contactSubtitle')}</div>
                </div>
            );
        }
        if (monthly === 0) {
            return (
                <div className="display-6 fw-bold my-3 text-white">
                    ₺0<span className="fs-6">{period === "monthly" ? t('pricing.perMonth') : t('pricing.perYear')}</span>
                </div>
            );
        }
        if (period === "monthly") {
            return (
                <div className="display-6 fw-bold my-3 text-white">
                    ₺{nf.format(monthly)}<span className="fs-6">{t('pricing.perMonth')}</span>
                </div>
            );
        }
        const original = monthly * 12;
        const discounted = calcYearly(monthly);
        return (
            <div className="my-3">
                <div className="text-soft" style={{ textDecoration: "line-through" }}>
                    ₺{nf.format(original)} {t('pricing.perYear')}
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="display-6 fw-bold text-white">₺{nf.format(discounted)}<span className="fs-6">{t('pricing.perYear')}</span></div>
                    <span className="badge bg-success-subtle text-success-emphasis">-20%</span>
                </div>
                <div className="text-soft small">{t('pricing.monthlyEquivalent')}: ₺{nf.format(Math.round(discounted / 12))}</div>
            </div>
        );
    };

    return (
        <section className="pricing-dark">
            <div className="container">
                {/* Başlık + Toggle */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <h2 className="fw-bold text-white">{t('pricing.title')}</h2>
                    <p className="text-soft mb-1">{t('pricing.subtitle')}</p>

                    <div className="d-inline-flex align-items-center gap-2 mt-2">
                        <span className={`small ${period === "monthly" ? "fw-semibold text-white" : "text-soft"}`}>{t('pricing.monthly')}</span>
                        <div className="form-check form-switch m-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="billingSwitch"
                                checked={period === "yearly"}
                                onChange={() => setPeriod((p) => (p === "monthly" ? "yearly" : "monthly"))}
                            />
                        </div>
                        <span className={`small ${period === "yearly" ? "fw-semibold text-white" : "text-soft"}`}>
                            {t('pricing.yearly')} <span className="badge bg-success-subtle text-success-emphasis ms-1">{t('pricing.yearlyDiscount')}</span>
                        </span>
                    </div>
                </div>

                {/* Kartlar */}
                <div className="row g-4">
                    {plans.map((p) => (
                        <div className="col-md-6 col-lg-3" key={p.key}>
                            <div className={`price-card h-100 d-flex flex-column p-4 rounded-4 ${p.highlight ? "price-card-popular" : ""}`}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="badge bg-secondary-subtle text-secondary-emphasis">{t(`pricing.${p.key}.badge`)}</span>
                                    {p.highlight && <span className="badge bg-warning text-dark">{t('pricing.plus.badgePopular')}</span>}
                                </div>

                                <div>
                                    <h5 className="mb-0 text-white">{p.key === 'free' ? '🎯' : p.key === 'plus' ? '⚡' : p.key === 'pro' ? '🚀' : '🏢'} {t(`pricing.${p.key}.title`)}</h5>
                                    <small className="text-soft">{t(`pricing.${p.key}.subtitle`)}</small>
                                </div>

                                <Price monthly={p.monthly} planKey={p.key} />

                                <ul className="list-unstyled flex-grow-1 mb-4">
                                    {t(`pricing.${p.key}.features`).map((f, i) => (
                                        <li key={i} className="mb-2 text-soft">
                                            <i className="bi bi-check-circle-fill text-accent me-2"></i>{f}
                                        </li>
                                    ))}
                                </ul>

                                <a href={p.key === 'enterprise' ? '/contact' : `/auth?plan=${p.key}`} className={`btn btn-${p.key === 'free' ? 'outline-light' : p.key === 'plus' ? 'primary' : p.key === 'pro' ? 'success' : 'dark'} w-100 mt-auto`}>
                                    {t(`pricing.${p.key}.cta`)}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-5">
                    <span className="badge rounded-pill bg-dark-subtle text-dark-emphasis px-3 py-2">
                        {t('pricing.tagline')}
                    </span>
                </div>
            </div>
        </section>
    );
}
