
export const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]+/g, '');

    if (cnpj.length !== 14) return false;

    // Elimina CNPJs invalidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
};

export const formatCNPJ = (value: string): string => {
    const cnpj = value.replace(/\D/g, '').substring(0, 14);
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.substring(0, 2)}.${cnpj.substring(2)}`;
    if (cnpj.length <= 8) return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5)}`;
    if (cnpj.length <= 12) return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8)}`;
    return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12)}`;
};

export const fetchCNPJData = async (cnpjString: string) => {
    const cnpj = cnpjString.replace(/\D/g, '');
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNPJ não encontrado ou inexistente.');
            }
            throw new Error('Erro ao verificar CNPJ. Tente novamente mais tarde.');
        }
        return await response.json();
    } catch (error: any) {
        throw error;
    }
};

export const validateCNH = (cnh: string): boolean => {
    cnh = cnh.replace(/\D/g, '');

    if (cnh.length !== 11 || /^(\d)\1+$/.test(cnh)) {
        return false;
    }

    let d1 = 0;
    let d2 = 0;

    for (let i = 0, j = 9; i < 9; i++, j--) {
        d1 += parseInt(cnh.charAt(i)) * j;
    }

    let v1 = d1 % 11;
    if (v1 >= 10) v1 = 0;

    for (let i = 0, j = 1, k = 9; i < 9; i++, j++, k--) {
        d2 += parseInt(cnh.charAt(i)) * j;
    }

    let v2 = d2 % 11;
    if (v2 >= 10) v2 = 0;

    // Many implementations use a specific algorithm for CNH. 
    // Refined CNH algorithm for Brazil:
    let c = cnh.split('').map(Number);
    let s1 = 0;
    for (let i = 0, j = 9; i < 9; i++, j--) s1 += c[i] * j;

    let dv1 = s1 % 11;
    let incr = 0;
    if (dv1 >= 10) {
        dv1 = 0;
        incr = 2;
    }

    let s2 = 0;
    for (let i = 0, j = 1; i < 9; i++, j++) s2 += c[i] * j;

    let dv2 = (s2 % 11) - incr;
    if (dv2 < 0) dv2 += 11;
    if (dv2 >= 10) dv2 = 0;

    return dv1 === c[9] && dv2 === c[10];
};

export const formatCNH = (value: string): string => {
    return value.replace(/\D/g, '').substring(0, 11);
};
